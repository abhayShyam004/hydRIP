import express from 'express'
import cors from 'cors'
import Database from 'better-sqlite3'
import { Server } from 'socket.io'
import http from 'http'
import crypto from 'crypto'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  }
})

app.use(cors())
app.use(express.json())

// Serve static frontend files in production
app.use(express.static(path.join(__dirname, 'dist')))

// Initialize SQLite Database
// On Render, use /tmp for temporary storage or set DATABASE_PATH env variable for persistent disk
const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'trip.sqlite')

// Ensure the directory exists before opening the database
const dbDir = path.dirname(dbPath)
if (dbDir && !fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const db = new Database(dbPath)

// Initialize Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS visited_stops (
    stop_id TEXT PRIMARY KEY,
    visited BOOLEAN DEFAULT 0,
    visited_at TEXT
  );

  CREATE TABLE IF NOT EXISTS checked_in (
    id TEXT PRIMARY KEY,
    stop_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    UNIQUE(stop_id, user_name)
  );

  CREATE TABLE IF NOT EXISTS checklist_definitions (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    label TEXT NOT NULL,
    sort_order INTEGER
  );

  CREATE TABLE IF NOT EXISTS checklist_items (
    id TEXT PRIMARY KEY,
    user_name TEXT NOT NULL,
    item_id TEXT NOT NULL,
    checked BOOLEAN DEFAULT 0,
    UNIQUE(user_name, item_id),
    FOREIGN KEY(item_id) REFERENCES checklist_definitions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS stops (
    id TEXT PRIMARY KEY,
    day INTEGER NOT NULL,
    time TEXT NOT NULL,
    date TEXT NOT NULL,
    name TEXT NOT NULL,
    location TEXT,
    distance TEXT,
    entry_fee NUMERIC DEFAULT 0,
    duration TEXT,
    description TEXT,
    photo_spot TEXT,
    abhay_note TEXT,
    alternative_name TEXT,
    alternative_maps_url TEXT,
    directions_url TEXT,
    sort_order INTEGER
  );

  CREATE TABLE IF NOT EXISTS restaurants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    meal_type TEXT,
    day INTEGER,
    time TEXT,
    address TEXT,
    distance TEXT,
    has_cash_only_note BOOLEAN DEFAULT 0,
    sort_order INTEGER
  );

  CREATE TABLE IF NOT EXISTS menu_items (
    id TEXT PRIMARY KEY,
    restaurant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    diet TEXT NOT NULL,
    sort_order INTEGER,
    FOREIGN KEY(restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS trip_tips (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    sort_order INTEGER
  );

  CREATE TABLE IF NOT EXISTS emergency_contacts (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    number TEXT NOT NULL,
    sort_order INTEGER
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    paid_by TEXT NOT NULL,
    split_with TEXT NOT NULL, -- Stored as JSON string
    category TEXT NOT NULL,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS settlements (
    id TEXT PRIMARY KEY,
    from_user TEXT NOT NULL,
    to_user TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    settled_at TEXT
  );

  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`)

// Enable Foreign Keys
db.pragma('foreign_keys = ON')

// Helper for broadcasting changes
const broadcastChange = (table) => {
  io.emit('db_change', { table })
}

// --- Dynamic API Routes ---
const tables = [
  'visited_stops', 'checked_in', 'checklist_definitions', 'checklist_items',
  'stops', 'restaurants', 'menu_items', 'trip_tips', 'emergency_contacts',
  'expenses', 'settlements', 'app_settings'
]

tables.forEach(table => {
  // GET
  app.get(`/api/${table}`, (req, res) => {
    let orderClause = ''
    if (req.query.order) {
      const [col, dir] = req.query.order.split('.')
      orderClause = ` ORDER BY ${col} ${dir === 'desc' ? 'DESC' : 'ASC'}`
    }
    try {
      let query = `SELECT * FROM ${table}`
      let params = []

      // Handle simple filters like ?user_name=eq.Abhay
      const filters = Object.entries(req.query).filter(([k]) => k !== 'order' && k !== 'select')
      if (filters.length > 0) {
        const conditions = filters.map(([k, v]) => {
          if (v.startsWith('eq.')) {
            params.push(v.replace('eq.', ''))
            return `${k} = ?`
          }
          return null
        }).filter(Boolean)
        
        if (conditions.length > 0) {
          query += ` WHERE ${conditions.join(' AND ')}`
        }
      }

      query += orderClause
      const rows = db.prepare(query).all(...params)
      
      // Parse JSON arrays for expenses
      if (table === 'expenses') {
        rows.forEach(r => r.split_with = JSON.parse(r.split_with))
      }
      res.json(rows)
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: err.message })
    }
  })

  // POST (Insert/Upsert)
  app.post(`/api/${table}`, (req, res) => {
    try {
      const data = Array.isArray(req.body) ? req.body : [req.body]
      if (data.length === 0) return res.json([])

      // Serialize arrays for SQLite
      data.forEach(item => {
        if (item.split_with && Array.isArray(item.split_with)) {
          item.split_with = JSON.stringify(item.split_with)
        }
        if (!item.id && table !== 'app_settings' && table !== 'visited_stops' && table !== 'checklist_definitions' && table !== 'stops' && table !== 'restaurants') {
           item.id = crypto.randomUUID()
        }
        if ((table === 'expenses' || table === 'settlements') && !item.created_at && !item.settled_at) {
           if (table === 'expenses') item.created_at = new Date().toISOString()
           if (table === 'settlements') item.settled_at = new Date().toISOString()
        }
      })

      const keys = Object.keys(data[0])
      
      // We'll use REPLACE INTO (Upsert behavior based on Primary Key/Unique constraints)
      const stmt = db.prepare(`
        REPLACE INTO ${table} (${keys.join(', ')}) 
        VALUES (${keys.map(() => '?').join(', ')})
      `)

      const insertMany = db.transaction((items) => {
        for (const item of items) {
          const values = keys.map(k => {
             const val = item[k];
             if (typeof val === 'boolean') return val ? 1 : 0;
             if (val === undefined) return null;
             return val;
          })
          stmt.run(values)
        }
      })
      
      insertMany(data)
      broadcastChange(table)
      res.json(data)
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: err.message })
    }
  })

  // PATCH (Update)
  app.patch(`/api/${table}/:id`, (req, res) => {
    try {
      const updates = req.body
      if (updates.split_with && Array.isArray(updates.split_with)) {
         updates.split_with = JSON.stringify(updates.split_with)
      }
      const keys = Object.keys(updates)
      const values = Object.values(updates).map(v => typeof v === 'boolean' ? (v ? 1 : 0) : (v === undefined ? null : v))
      const stmt = db.prepare(`
        UPDATE ${table} SET ${keys.map(k => `${k} = ?`).join(', ')} WHERE id = ?
      `)
      stmt.run(...values, req.params.id)
      broadcastChange(table)
      res.json({ success: true })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: err.message })
    }
  })
  
  // Custom update for app_settings which uses 'key' as primary
  app.patch(`/api/${table}/key/:key`, (req, res) => {
     try {
      const updates = req.body
      const keys = Object.keys(updates)
      const values = Object.values(updates).map(v => typeof v === 'boolean' ? (v ? 1 : 0) : (v === undefined ? null : v))
      const stmt = db.prepare(`
        UPDATE ${table} SET ${keys.map(k => `${k} = ?`).join(', ')} WHERE key = ?
      `)
      stmt.run(...values, req.params.key)
      broadcastChange(table)
      res.json({ success: true })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: err.message })
    }
  })

  // DELETE
  app.delete(`/api/${table}/:id`, (req, res) => {
    try {
      const stmt = db.prepare(`DELETE FROM ${table} WHERE id = ?`)
      stmt.run(req.params.id)
      broadcastChange(table)
      res.json({ success: true })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: err.message })
    }
  })
  
  // Custom DELETE queries
  app.delete(`/api/checked_in/custom`, (req, res) => {
     try {
        const { stop_id, user_name } = req.query
        const stmt = db.prepare(`DELETE FROM checked_in WHERE stop_id = ? AND user_name = ?`)
        stmt.run(stop_id.replace('eq.', ''), user_name.replace('eq.', ''))
        broadcastChange('checked_in')
        res.json({ success: true })
     } catch (err) {
        console.error(err)
        res.status(500).json({ error: err.message })
     }
  })
})

// Catch-all route to serve the React app for any other requests
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

const PORT = process.env.PORT || 3001
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on port ${PORT}`)
})
