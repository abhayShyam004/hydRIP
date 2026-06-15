import { io } from 'socket.io-client'

const API_URL = 'http://localhost:3001/api'
const socket = io('http://localhost:3001')

class SupabaseMock {
  from(table) {
    return {
      select: (columns = '*') => {
        let orderClause = ''
        let queryParams = ''
        return {
          order: (col, options = { ascending: true }) => {
            orderClause = `order=${col}.${options.ascending ? 'asc' : 'desc'}`
            return {
              then: async (resolve) => {
                 try {
                    const res = await fetch(`${API_URL}/${table}?${orderClause}${queryParams ? '&'+queryParams : ''}`)
                    const data = await res.json()
                    resolve({ data, error: null })
                 } catch (error) {
                    resolve({ data: null, error })
                 }
              }
            }
          },
          eq: (col, val) => {
             queryParams += `${queryParams ? '&' : ''}${col}=eq.${val}`
             return {
                then: async (resolve) => {
                   try {
                      const res = await fetch(`${API_URL}/${table}?${orderClause}${queryParams ? '&'+queryParams : ''}`)
                      const data = await res.json()
                      resolve({ data, error: null })
                   } catch (error) {
                      resolve({ data: null, error })
                   }
                }
             }
          },
          then: async (resolve) => {
             try {
                const res = await fetch(`${API_URL}/${table}?${orderClause}${queryParams ? '&'+queryParams : ''}`)
                const data = await res.json()
                resolve({ data, error: null })
             } catch (error) {
                resolve({ data: null, error })
             }
          }
        }
      },
      upsert: (payload, options = {}) => {
        return {
          then: async (resolve) => {
             try {
                const res = await fetch(`${API_URL}/${table}`, {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify(payload)
                })
                const data = await res.json()
                resolve({ data, error: null })
             } catch (error) {
                resolve({ data: null, error })
             }
          }
        }
      },
      insert: (payload) => {
        return {
          then: async (resolve) => {
             try {
                const res = await fetch(`${API_URL}/${table}`, {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify(payload)
                })
                const data = await res.json()
                resolve({ data, error: null })
             } catch (error) {
                resolve({ data: null, error })
             }
          }
        }
      },
      update: (payload) => {
         let eqClause = null
         return {
            eq: (col, val) => {
               eqClause = { col, val }
               return {
                 then: async (resolve) => {
                    try {
                       const url = col === 'key' ? `${API_URL}/${table}/key/${val}` : `${API_URL}/${table}/${val}`
                       const res = await fetch(url, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(payload)
                       })
                       const data = await res.json()
                       resolve({ data, error: null })
                    } catch (error) {
                       resolve({ data: null, error })
                    }
                 }
               }
            }
         }
      },
      delete: () => {
         return {
            eq: (col, val) => {
               // Handle composite delete for checked_in
               if (table === 'checked_in' && col === 'stop_id') {
                  let userEq = null
                  return {
                     eq: (col2, val2) => {
                        userEq = { col2, val2 }
                        return {
                           then: async (resolve) => {
                              try {
                                 await fetch(`${API_URL}/checked_in/custom?stop_id=eq.${val}&user_name=eq.${val2}`, { method: 'DELETE' })
                                 resolve({ error: null })
                              } catch(error) {
                                 resolve({ error })
                              }
                           }
                        }
                     }
                  }
               }
               return {
                  then: async (resolve) => {
                     try {
                        const url = col === 'key' ? `${API_URL}/${table}/key/${val}` : `${API_URL}/${table}/${val}`
                        await fetch(url, { method: 'DELETE' })
                        resolve({ error: null })
                     } catch(error) {
                        resolve({ error })
                     }
                  }
               }
            }
         }
      }
    }
  }

  channel(name) {
    return {
      on(event, filter, callback) {
         socket.on('db_change', (data) => {
            if (data.table === filter.table) {
               callback()
            }
         })
         return this
      },
      subscribe() { return this }
    }
  }

  removeChannel() {
     // Simplifying cleanup for now
  }
}

export const supabase = new SupabaseMock()
