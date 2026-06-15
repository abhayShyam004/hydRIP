# HydRip — Build Specification v2

---

## READ THIS FIRST — HOW TO USE THIS DOCUMENT

This is a complete build specification for **HydRip**, a personalised trip companion
app for a 5-person friend group visiting Hyderabad on June 18–19, 2026.

**Do not start writing code until you have read this entire document.**

Build in this exact sequence. Complete each phase fully before starting the next.
Do not scaffold everything and fill in later — incomplete implementations compound.

```
Phase 1 — Foundation
  1.1  Project setup, Vite config, environment variables
  1.2  Google Fonts link in index.html
  1.3  CSS variables in index.css (every token in this spec, nothing else)
  1.4  src/supabase.js (single Supabase client, never initialised elsewhere)
  1.5  src/seed.js (all seed data as named constants + seedIfEmpty function)
  1.6  src/users.js (USERS constant — five profiles, fixed forever)

Phase 2 — Shared Components (build once, use everywhere)
  2.1  Avatar
  2.2  SectionLabel
  2.3  PillTab
  2.4  PillTag
  2.5  GhostButton
  2.6  PrimaryButton
  2.7  InlineEdit  ← most important component; get this right before any screen
  2.8  BottomSheet (base)
  2.9  ConfirmSheet
  2.10 Toast (global, used for save errors)

Phase 3 — App Shell
  3.1  UserPicker screen
  3.2  localStorage read/write logic (userName key only)
  3.3  App.jsx — conditional render: picker or main app
  3.4  BottomNav (5 tabs, active state, label only when active)
  3.5  Tab routing (useState — no React Router needed)

Phase 4 — Screens (in order)
  4.1  HomeScreen (Hero → Weather → NextStop → CheckIn → QuickLinks)
  4.2  PlanScreen (timeline layout, StopCard collapsed + expanded)
  4.3  FoodScreen (RestaurantCard, MenuItem, diet filter logic)
  4.4  ExpensesScreen (balance calc, AddExpenseSheet, SettleSheet)
  4.5  MoreScreen (Checklist, TripTips, EmergencyContacts)

Phase 5 — Abhay Editor Mode
  5.1  Wrap every editable field in InlineEdit when activeUser === 'Abhay'
  5.2  Add stop / add restaurant / add tip / add item affordances
  5.3  Delete affordances (all go through ConfirmSheet)
  5.4  app_settings edits (hero subtitle, countdown target, weather)

Phase 6 — Realtime Subscriptions
  6.1  Add subscriptions to each screen per the table in this spec
  6.2  Verify unsubscribe on unmount for every channel
```

If your context window runs short, stop at the end of a phase boundary.
Never stop mid-component or mid-screen.

---

## What You Are Building

HydRip is a mobile-first React web app. It is a **personalised trip companion** — not
a dashboard, not a generic travel tool. Every screen belongs to one of five people
and adapts to who is viewing it.

The design language is **warm editorial**: a premium print travel magazine translated
into a mobile app. Restrained. Confident. Typographically precise. No default Tailwind
choices. No AI-generated look. Every decision is specific to this brief.

---

## Tech Stack

| Tool              | Version / Notes                                               |
|-------------------|---------------------------------------------------------------|
| React             | 18 — functional components only, no class components         |
| Vite              | Latest stable                                                 |
| Tailwind CSS      | For utility classes only; all values from CSS variables below |
| Supabase JS       | v2 — single client in src/supabase.js                        |
| Lucide React      | All icons — no other icon library                            |

**Hard constraints — violation = rebuild:**
- No animation libraries (Framer Motion, GSAP, etc.) — CSS transitions only
- No native `<select>` elements — custom dropdowns only
- No `alert()`, `confirm()`, `prompt()` — bottom sheets for all confirmations
- No emoji anywhere — not in JSX, JS strings, data constants, or comments
- No `console.log` left in production code
- No external images, `<img>` tags, or `src` URLs for decorative content
- No font other than Cormorant Garamond, DM Sans, and DM Mono

---

## Environment & Supabase Setup

### `.env` (project root)
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### `src/supabase.js`
```js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

Import from this file everywhere. Never call `createClient` more than once.

---

## Supabase Schema

Run this SQL in full before building. Schema is the source of truth — if the prompt
prose ever conflicts with the schema, the schema wins.

```sql
-- Shared visited state (all five users see the same toggle)
create table visited_stops (
  stop_id text primary key,
  visited boolean default false,
  visited_at timestamptz
);

-- Per-stop per-user check-in
create table checked_in (
  id uuid default gen_random_uuid() primary key,
  stop_id text not null,
  user_name text not null,
  unique(stop_id, user_name)
);

-- Checklist item definitions — the items themselves, shared across all users
create table checklist_definitions (
  id text primary key,
  category text not null,
  label text not null,
  sort_order integer
);

-- Per-user checklist state — fully independent between users
-- CASCADE: deleting a checklist_definition deletes all user state for that item
create table checklist_items (
  id uuid default gen_random_uuid() primary key,
  user_name text not null,
  item_id text not null references checklist_definitions(id) on delete cascade,
  checked boolean default false,
  unique(user_name, item_id)
);

-- Editable itinerary stops
create table stops (
  id text primary key,
  day integer not null,
  time text not null,
  date text not null,
  name text not null,
  location text,
  distance text,
  entry_fee numeric default 0,
  duration text,
  description text,
  photo_spot text,
  abhay_note text,
  alternative_name text,
  alternative_maps_url text,
  directions_url text,
  sort_order integer
);

-- Editable restaurants
create table restaurants (
  id text primary key,
  name text not null,
  meal_type text,
  day integer,
  time text,
  address text,
  distance text,
  has_cash_only_note boolean default false,
  sort_order integer
);

-- Menu items — CASCADE: deleting a restaurant deletes its menu items
create table menu_items (
  id uuid default gen_random_uuid() primary key,
  restaurant_id text not null references restaurants(id) on delete cascade,
  name text not null,
  price numeric not null,
  diet text not null check (diet in ('veg', 'non-veg')),
  sort_order integer
);

-- Editable trip tips
create table trip_tips (
  id uuid default gen_random_uuid() primary key,
  content text not null,
  sort_order integer
);

-- Emergency contacts
create table emergency_contacts (
  id uuid default gen_random_uuid() primary key,
  label text not null,
  number text not null,
  sort_order integer
);

-- Expenses
create table expenses (
  id uuid default gen_random_uuid() primary key,
  description text not null,
  amount numeric not null,
  paid_by text not null,
  split_with text[] not null,
  category text not null,
  created_at timestamptz default now()
);

-- Settlements
create table settlements (
  id uuid default gen_random_uuid() primary key,
  from_user text not null,
  to_user text not null,
  amount numeric not null,
  settled_at timestamptz default now()
);

-- App-level settings (editable by Abhay)
-- Keys: countdown_target, hero_subtitle, weather_text, weather_sub
create table app_settings (
  key text primary key,
  value text not null
);
```

**In the Supabase dashboard:**
- Enable realtime on ALL tables listed above
- Disable Row Level Security on all tables (no authentication in this app)
- Or add an open anon read/write policy on each table if RLS cannot be disabled

---

## Design System

### CSS Variables

Place all of these in `index.css` under `:root`. These are the only color values
used anywhere in the app. No raw hex values in component files — always reference
a variable.

```css
:root {
  --bg:          #FAF7F2;
  --surface:     #FFFFFF;
  --surface-2:   #F3EFE8;
  --ink:         #1A1410;
  --ink-2:       #6B6560;
  --ink-3:       #A89F97;
  --rust:        #C1440E;
  --rust-light:  #F7EDE8;
  --amber:       #D4861A;
  --amber-light: #FDF3E3;
  --veg:         #2E7D4F;
  --nonveg:      #B03020;
  --line:        rgba(26, 20, 16, 0.10);
  --line-strong: rgba(26, 20, 16, 0.22);
}

/* Reduced motion — must be present */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
```

### Typography

`index.html` `<head>`:
```html
<title>HydRip</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,600&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400&display=swap" rel="stylesheet" />
```

| Role    | Family             | Weights       | Used for                                                  |
|---------|--------------------|---------------|-----------------------------------------------------------|
| Display | Cormorant Garamond | 400, 500, 600 | All headings, stop names, restaurant names, section titles|
| Body    | DM Sans            | 300, 400, 500 | All body text, labels, inputs, navigation, pills, buttons |
| Data    | DM Mono            | 400           | All numbers: times, prices, amounts, countdowns           |

Rules (never violated):
- Display headings: `letter-spacing: -0.02em`, `line-height: 1.1`
- All-caps labels: `letter-spacing: 0.10em`
- Money: always `Rs.` prefix + DM Mono. Never use the rupee symbol ₹
- No system fonts anywhere in the app

### Spacing

8px base grid. All spacing values are multiples of 8.

```
xs   = 8px
sm   = 16px
md   = 24px
lg   = 32px
xl   = 48px
2xl  = 64px

Card internal padding:   20px
Gap between cards:       12px
Gap between sections:    32px
Scrollable screen padding-bottom: 88px (clears the nav bar)
```

### Elevation

No drop shadows anywhere. Use borders and backgrounds only.

```
Cards:             border: 0.5px solid var(--line)
Bottom sheets:     border-top: 1px solid var(--line-strong) only
Active / pressed:  background: var(--surface-2)
```

### Border Radius

```
Cards:                    12px
Buttons:                  8px
Pills and tags:           999px
Inputs:                   8px
Bottom sheet top corners: 20px 20px 0 0
Avatar circles:           50%
```

### Motion

One easing curve everywhere: `cubic-bezier(0.16, 1, 0.3, 1)` at `260ms`.

```
Bottom sheets:    transform: translateY(100%) → translateY(0)
Tab/screen change: opacity: 0 + translateY(6px) → natural values
StopCard expand:  max-height transition (collapsed → expanded estimate)
InlineEdit appear: opacity: 0 → 1 at 120ms
```

### Icons

Lucide React exclusively. Import individually:
```js
import { Pencil, Check, X, Plus, Sun, Home, CalendarDays,
         UtensilsCrossed, Receipt, MoreHorizontal } from 'lucide-react'
```

### Layout

Max width `430px`, centered on desktop. Everything outside that container uses
`background: var(--bg)`. No phone frame, no border, no decoration.

---

## User Profiles — `src/users.js`

Fixed forever. Not editable by anyone, including Abhay.

```js
export const USERS = [
  { name: 'Abhay', role: 'Tour Guide',  diet: 'non-veg', persona: 'The one who planned it', color: '#C1440E' },
  { name: 'Aswin', role: 'Traveller',   diet: 'non-veg', persona: 'The Biryani Hunter',     color: '#D4861A' },
  { name: 'Bala',  role: 'Traveller',   diet: 'non-veg', persona: 'The Shot Caller',         color: '#5C8C6A' },
  { name: 'Alwin', role: 'Traveller',   diet: 'non-veg', persona: 'The Reluctant One',       color: '#7B6147' },
  { name: 'Kashi', role: 'Traveller',   diet: 'veg',     persona: 'The Veg Vigilante',       color: '#3B7A8A' },
]
```

---

## Shared Components

Build all of these in Phase 2 before touching any screen.

### `<Avatar size />`

Filled circle. `border-radius: 50%`. Size prop: `32` or `48` (px).
User's first initial in Cormorant Garamond 600, white.
Background: user's `color` from USERS constant.

```jsx
function Avatar({ user, size = 32 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: user.color, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Cormorant Garamond', fontWeight: 600,
      fontSize: size * 0.45, color: '#fff', flexShrink: 0
    }}>
      {user.name[0]}
    </div>
  )
}
```

### `<SectionLabel text />`

All-caps section header. DM Sans 400, 11px, `var(--ink-3)`, `letter-spacing: 0.10em`.
`margin-bottom: 12px`.

### `<PillTab label active onClick />`

Active: `background: var(--ink)`, white text, DM Sans 500 14px.
Inactive: `background: var(--surface)`, `border: 0.5px solid var(--line)`,
`var(--ink-2)` text. `border-radius: 999px`, `padding: 7px 18px`.

### `<PillTag label color />`

`border-radius: 999px`, `padding: 3px 10px`, DM Sans 400 12px.
`color` prop controls text and tint background (`color` at 12% opacity).

### `<GhostButton label onClick color />`

Text-only. No background, no border. DM Sans 500 13px.
`color` prop: `var(--rust)` (default) or `var(--nonveg)` for destructive actions.

### `<PrimaryButton label onClick disabled />`

Full-width. Height 52px. `background: var(--rust)`. White text DM Sans 500 15px.
`border-radius: 8px`. Disabled: `opacity: 0.45`.

### `<InlineEdit />` — The Most Important Component

Build this first. Used everywhere Abhay can edit content.
The text should feel like it *became* editable — not like a form appeared.

```jsx
function InlineEdit({ value, onSave, inputType = 'text', style = {} }) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      if (inputType === 'textarea') autoResize(inputRef.current)
    }
  }, [isEditing])

  const autoResize = (el) => {
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }

  const handleSave = async () => {
    if (draft !== value) await onSave(draft)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setDraft(value)
    setIsEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputType !== 'textarea') handleSave()
    if (e.key === 'Escape') handleCancel()
  }

  const inputStyle = {
    ...style,
    border: 'none',
    borderBottom: '1.5px solid var(--rust)',
    borderRadius: 0,
    background: 'transparent',
    outline: 'none',
    padding: '0 0 2px 0',
    width: '100%',
    resize: 'none',
  }

  if (!isEditing) return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={style}>{value}</span>
      <Pencil
        size={14}
        color="var(--ink-3)"
        style={{ cursor: 'pointer', flexShrink: 0 }}
        onClick={() => setIsEditing(true)}
      />
    </span>
  )

  return (
    <span style={{ display: 'inline-flex', alignItems: 'flex-start', gap: 6, width: '100%' }}>
      {inputType === 'textarea' ? (
        <textarea
          ref={inputRef}
          value={draft}
          style={{ ...inputStyle, rows: 1 }}
          onChange={e => { setDraft(e.target.value); autoResize(e.target) }}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <input
          ref={inputRef}
          type={inputType}
          value={draft}
          style={inputStyle}
          onChange={e => setDraft(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
        />
      )}
      <Check size={14} color="var(--rust)" style={{ cursor: 'pointer' }} onClick={handleSave} />
      <X size={14} color="var(--ink-3)" style={{ cursor: 'pointer' }} onClick={handleCancel} />
    </span>
  )
}
```

### `<BottomSheet open onClose children />`

Base component. All sheets extend this — never build a one-off sheet.

```jsx
function BottomSheet({ open, onClose, children }) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(26,20,16,0.40)',
    }} onClick={onClose}>
      <div
        style={{
          position: 'absolute', bottom: 0, left: '50%',
          transform: 'translateX(-50%)',
          width: '100%', maxWidth: 430,
          background: 'var(--surface)',
          borderRadius: '20px 20px 0 0',
          borderTop: '1px solid var(--line-strong)',
          maxHeight: '90vh', overflowY: 'auto',
          transition: 'transform 260ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          width: 36, height: 4, background: 'var(--line-strong)',
          borderRadius: 999, margin: '12px auto 0',
        }} />
        {children}
      </div>
    </div>
  )
}
```

### `<ConfirmSheet open onClose onConfirm title body confirmLabel />`

Uses `<BottomSheet>`. Title in Cormorant Garamond 600 24px. Body in DM Sans 400 14px
`var(--ink-2)`. Two buttons: `<PrimaryButton>` (confirmLabel) + `<GhostButton>` (Cancel).

### `<Toast message />`

Global. One active at a time. Appears above the nav bar. Auto-dismisses after 2.5s.

```
position: fixed
bottom: 76px
left: 50%, transform: translateX(-50%)
background: var(--ink)
color: white
border-radius: 8px
padding: 10px 16px
DM Sans 400 13px
z-index: 200
```

Implement as a context: `ToastContext` with a `showToast(message)` function.
Wrap the app in `<ToastProvider>`. Call `showToast('Couldn\'t save. Try again.')`
from any failed write operation.

---

## Seeding — `src/seed.js`

Export all seed data as named constants. Export a single `seedIfEmpty` async function.
Call `seedIfEmpty()` from `App.jsx` before rendering any screen.
If seed fails, log the error and continue — never block rendering.

```js
export async function seedIfEmpty() {
  try {
    const { count } = await supabase
      .from('stops')
      .select('*', { count: 'exact', head: true })

    if (count === 0) {
      await supabase.from('stops').upsert(SEED_STOPS, { onConflict: 'id' })
      await supabase.from('restaurants').upsert(SEED_RESTAURANTS, { onConflict: 'id' })
      await supabase.from('menu_items').upsert(SEED_MENU_ITEMS, { onConflict: 'id' })
      await supabase.from('checklist_definitions').upsert(SEED_CHECKLIST, { onConflict: 'id' })
      await supabase.from('trip_tips').upsert(SEED_TIPS, { onConflict: 'id' })
      await supabase.from('emergency_contacts').upsert(SEED_CONTACTS, { onConflict: 'id' })
      await supabase.from('app_settings').upsert(SEED_SETTINGS, { onConflict: 'key' })
    }
  } catch (err) {
    console.error('Seed failed:', err)
  }
}
```

---

## No Authentication

No login. No passwords. No sign-up.

On first open: `UserPicker` screen. The user taps their name.
Stored in `localStorage` as `{ userName: 'Abhay' }`.
On subsequent visits: read `localStorage`, skip picker, load home screen.

A "Switch" text link appears in the top-right corner of every screen.
Style: DM Sans 400 13px `var(--ink-3)`. Not a button — no background, no border.
Tapping: `localStorage.removeItem('userName')` → return to picker.

---

## Realtime Subscriptions — Pattern

Use this exact pattern in every screen. Never use `.unsubscribe()`.

```js
useEffect(() => {
  fetchData() // initial load

  const channel = supabase
    .channel('descriptive-channel-name')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'table_name' }, () => {
      fetchData() // re-fetch on any change
    })
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}, [])
```

| Screen   | Subscribe to tables                                              |
|----------|------------------------------------------------------------------|
| Home     | stops, checked_in, app_settings                                  |
| Plan     | stops, visited_stops, checked_in                                 |
| Food     | restaurants, menu_items                                          |
| Expenses | expenses, settlements                                            |
| More     | checklist_items, checklist_definitions, trip_tips, emergency_contacts |

---

## Error Handling — Standard Patterns

**Fetch error (data failed to load):**
Render below the relevant section header, no red boxes:
```
Could not load [content]. Pull down to retry.
```
DM Sans 400 13px `var(--ink-3)`. Inline, quiet.

**Write error (save failed):**
Call `showToast('Couldn\'t save. Try again.')` from ToastContext.
Never show raw error objects.

**Realtime drop:**
Do not add manual reconnect logic. Supabase v2 handles reconnection automatically.

**Empty state (no data, no error):**
```
Nothing here yet.
```
DM Sans 300 13px `var(--ink-3)`, centered in the section area.

---

## Screen 1 — UserPicker

Full screen. `background: var(--bg)`. Content vertically centered.

Top overline:
```
HYDERABAD — JUNE 18–19
```
DM Sans 400 11px, `var(--ink-3)`, `letter-spacing: 0.12em`.

App name:
```
HydRip
```
Cormorant Garamond 600 italic, 18px, `var(--ink-3)`. Subtle — not a hero.

Main heading:
```
Who's travelling?
```
Cormorant Garamond 600, 36px, `var(--ink)`.

Five user cards, 12px gap. Each card:
- White background, `border: 0.5px solid var(--line)`, `border-radius: 12px`,
  `padding: 16px 20px`
- Left: 48px `<Avatar>`
- Center: name DM Sans 500 17px `var(--ink)`. Persona below DM Sans 300 13px `var(--ink-2)`
- Right: diet dot — 10px filled circle. `var(--veg)` for Kashi, `var(--nonveg)` for others.
  No text label.
- On tap: store name in localStorage, transition to home with `opacity` + `translateY(4px)`

Footer:
```
You can switch anytime from any screen
```
DM Sans 300 13px `var(--ink-3)`, centered.

---

## Screen 2 — HomeScreen

### Top Bar

Left: 32px `<Avatar>` + name DM Sans 500 16px `var(--ink)`, 8px gap.
Right: "Switch" — DM Sans 400 13px `var(--ink-3)`.

### Hero Card

`background: #C1440E`. `border-radius: 12px`. `overflow: hidden`. `position: relative`.
No gradients, no images, no external assets.

Inner content: `position: relative`, `z-index: 1`, `padding: 24px`, `padding-bottom: 80px`.

Content top to bottom:
```
GROUP TRIP
```
DM Sans 400 11px, `rgba(255,255,255,0.65)`, `letter-spacing: 0.12em`

```
Hyderabad
```
Cormorant Garamond 600 42px, white, `letter-spacing: -0.02em`

```
[hero_subtitle from app_settings]
```
DM Sans 300 14px, `rgba(255,255,255,0.80)`

Divider: `1px solid rgba(255,255,255,0.20)`, 16px margin top/bottom.

```
DEPARTING IN
```
DM Sans 400 10px, `rgba(255,255,255,0.60)`, `letter-spacing: 0.10em`

Countdown — flex row, 4 columns. Each column:
- Number: DM Mono 28px white
- Unit: DM Sans 300 11px `rgba(255,255,255,0.60)`. Labels: `d  h  m  s`
- Updates every second via `setInterval`. Clear on unmount.
- Target from `app_settings.countdown_target`.

**Countdown states:**
```js
const target = new Date(countdownTarget)
const now = new Date()
const diff = target - now
// diff > 0: show countdown
// diff <= 0 AND trip not over: hide countdown, show "Trip is on" status
// Trip over (now > last stop end time): replace entire hero with completion card
```

**Trip complete state:** Replace hero card with:
`background: var(--surface-2)`, `border-radius: 12px`, `padding: 24px`.
`Trip complete` — Cormorant Garamond 600 28px `var(--ink)`.
`June 18–19, Hyderabad` — DM Sans 300 14px `var(--ink-2)`.

### SVG Skyline

Position: `absolute`, `bottom: 0`, `left: 0`, `width: 100%`, `height: 72px`, `z-index: 0`.
Built as inline JSX SVG — no `<img>` tag, no external source.

Use this exact SVG path data. Do not modify or regenerate:

```jsx
<svg viewBox="0 0 430 72" xmlns="http://www.w3.org/2000/svg"
     style={{ position:'absolute', bottom:0, left:0, width:'100%', height:72, zIndex:0 }}>
  {/* Charminar — left-center */}
  <rect x="175" y="20" width="6" height="52" fill="#A83A0C"/>
  <rect x="249" y="20" width="6" height="52" fill="#A83A0C"/>
  <rect x="192" y="28" width="6" height="44" fill="#A83A0C"/>
  <rect x="232" y="28" width="6" height="44" fill="#A83A0C"/>
  <rect x="181" y="32" width="68" height="40" fill="#A83A0C"/>
  <polygon points="178,20 181,32 175,32" fill="#A83A0C"/>
  <polygon points="252,20 255,32 249,32" fill="#A83A0C"/>
  <polygon points="195,28 198,36 192,36" fill="#A83A0C"/>
  <polygon points="235,28 238,36 232,36" fill="#A83A0C"/>
  <ellipse cx="215" cy="44" rx="12" ry="8" fill="#A83A0C"/>
  {/* Hussain Sagar Buddha — right */}
  <rect x="320" y="48" width="24" height="8" fill="#A83A0C"/>
  <rect x="326" y="36" width="12" height="12" fill="#A83A0C"/>
  <ellipse cx="332" cy="34" rx="8" ry="10" fill="#A83A0C"/>
  <rect x="329" y="24" width="6" height="10" fill="#A83A0C"/>
  <ellipse cx="332" cy="22" rx="5" ry="5" fill="#A83A0C"/>
  {/* Dome shape — far left */}
  <rect x="60" y="40" width="40" height="32" fill="#A83A0C"/>
  <ellipse cx="80" cy="40" rx="20" ry="14" fill="#A83A0C"/>
  <rect x="78" y="24" width="4" height="16" fill="#A83A0C"/>
  {/* Ground fill */}
  <rect x="0" y="68" width="430" height="4" fill="#A83A0C"/>
  {/* Filler buildings */}
  <rect x="0" y="50" width="50" height="22" fill="#A83A0C"/>
  <rect x="110" y="44" width="55" height="28" fill="#A83A0C"/>
  <rect x="360" y="42" width="70" height="30" fill="#A83A0C"/>
</svg>
```

All shapes: `fill="#A83A0C"`. No strokes, no gradients, no opacity. Flat filled paths.

### Abhay — Hero Edit Affordances

When `activeUser === 'Abhay'`:
- `hero_subtitle` line: wrap in `<InlineEdit>`. Saves to `app_settings`.
- `countdown_target`: pencil → native HTML `<input type="datetime-local">` (acceptable here).
- Weather strip both lines: wrap in `<InlineEdit>`. Saves to `app_settings`.
- All edits `upsert` to `app_settings` with `onConflict: 'key'`. Realtime propagates to all.

### Weather Strip

`background: var(--rust-light)`. `border: 0.5px solid rgba(193,68,14,0.20)`.
`border-radius: 12px`. `padding: 14px 16px`. Flex row, vertically centered, 12px gap.

Left: Lucide `Sun` 18px `var(--rust)`.
Right:
- Line 1: `[weather_text]` — DM Sans 400 14px `var(--ink)`
- Line 2: `[weather_sub]` — DM Sans 300 13px `var(--ink-2)`

### Next Stop Card

`<SectionLabel text="NEXT STOP" />`

White card. `border-left: 3px solid var(--rust)`. `border-radius: 12px`. `padding: 20px`.

**Next stop logic — runs on mount and every 60 seconds:**

```js
const FALLBACK_DURATION_MIN = 90

function getActiveOrNextStop(stops) {
  const now = new Date()
  for (const stop of [...stops].sort((a, b) => a.sort_order - b.sort_order)) {
    const start = new Date(`${stop.date}T${stop.time.replace(' ', '')}`)
    const durationMin = parseDurationToMinutes(stop.duration) || FALLBACK_DURATION_MIN
    const end = new Date(start.getTime() + durationMin * 60000)
    if (now >= start && now < end) return { stop, status: 'active' }
    if (now < start) return { stop, status: 'upcoming' }
  }
  return null
}
```

Card content:
- Stop name: Cormorant Garamond 600 22px `var(--ink)`
- Time: DM Mono 13px `var(--ink-2)`
- Distance: DM Mono 13px `var(--ink-3)`

**Abhay's note block** (shown to all non-Abhay users when `abhay_note` is set):
- 16px top margin, `border-left: 2px solid var(--amber)`, `padding-left: 12px`
- Text: DM Sans 400 italic 14px `var(--ink-2)`
- Signed: `— Abhay` DM Mono 12px `var(--ink-3)`

**For Abhay only:** instead of the note block, show:
`Your tip for this stop` — DM Sans 400 13px `var(--rust)`. Tapping opens
`<InlineEdit>` for `abhay_note` on this stop.

Bottom: `View full plan` — `<GhostButton>` right-aligned → navigates to Plan tab.

### Group Check-in Strip

`<SectionLabel text="AT THIS STOP" />`

Five 32px `<Avatar>` components, flex row, 8px gap.
Checked-in: `outline: 2px solid var(--veg); outline-offset: 3px`.
Not checked in: no outline.

State from `checked_in` table filtered by current `stop_id`.

Tapping your own avatar toggles check-in:
```js
const isCheckedIn = checkedInUsers.includes(activeUser)
if (isCheckedIn) {
  await supabase.from('checked_in').delete()
    .eq('stop_id', currentStopId).eq('user_name', activeUser)
} else {
  await supabase.from('checked_in').upsert({ stop_id: currentStopId, user_name: activeUser })
}
```
Tapping another user's avatar: no action.

### Quick Links Row

Horizontal scroll, `overflow-x: auto`, no scrollbar
(`scrollbar-width: none; ::-webkit-scrollbar { display: none }`).

Four pills: `Today's Plan` · `Food Guide` · `Expenses` · `Checklist`
DM Sans 400 14px. `background: var(--surface)`. `border: 0.5px solid var(--line)`.
`padding: 8px 16px`. `border-radius: 999px`. Each navigates to the corresponding tab.

---

## Screen 3 — Plan

### Header

`The Plan` — Cormorant Garamond 600 32px `var(--ink)`.
Two `<PillTab>` components: `Jun 18` · `Jun 19`.

### Timeline Layout

Each day: stops in a vertical timeline. Three-column row per stop:

```
[56px time col] [24px line col] [flex-1 card col]
```

- Left: DM Mono 12px `var(--ink-3)`, aligned to card midpoint
- Center: vertical dashed line `var(--line-strong)`. At each stop: 10px filled circle
  `var(--rust)`, centered on the line
- Right: `<StopCard>`

### `<StopCard>` — Collapsed

`border: 0.5px solid var(--line)`. `border-radius: 12px`. `padding: 16px`.

```
[Stop Name]                                   [Visited toggle]
[Location]  ·  [Distance]
[Entry fee pill — only if entry_fee > 0]
```

- Stop name: Cormorant Garamond 600 18px `var(--ink)`
- Location: DM Sans 300 13px `var(--ink-2)`
- Distance: DM Mono 12px `var(--ink-3)`
- Entry fee pill: `background: var(--amber-light)`, `border-radius: 999px`,
  `padding: 3px 10px`, DM Sans 400 12px `var(--amber)`, `Rs.` prefix in DM Mono
- Visited toggle: 20px circle. Unvisited: outline `var(--line-strong)`.
  Visited: filled `var(--veg)` + Lucide `Check` 12px white.

```js
// Visited toggle — shared across all users
await supabase.from('visited_stops').upsert(
  { stop_id: stop.id, visited: !currentVisited, visited_at: new Date().toISOString() },
  { onConflict: 'stop_id' }
)
```

### `<StopCard>` — Expanded

Tap to expand. `max-height` transition at `260ms cubic-bezier(0.16, 1, 0.3, 1)`.

Additional content:
```
[Description]

PHOTO SPOT
[photo_spot text]

[Abhay's note — amber border, italic, signed — hidden from Abhay]

Alternative: [alternative_name as underlined rust link → alternative_maps_url]

[Get Directions → GhostButton → directions_url]
```

- Description: DM Sans 300 14px `var(--ink-2)`, 16px top margin
- `PHOTO SPOT`: `<SectionLabel>`, 16px top margin
- Photo spot text: DM Sans 400 14px `var(--ink)`

### Abhay — Plan Edit Affordances

Every `<StopCard>` shows `<InlineEdit>` on:

| Field          | inputType  |
|----------------|------------|
| Stop name      | text       |
| Time           | text       |
| Location       | text       |
| Distance       | text       |
| Entry fee      | number     |
| Duration       | text       |
| Description    | textarea   |
| Photo spot     | text       |
| Abhay's note   | textarea   |
| Alt name       | text       |

**Add stop:** Dashed-border placeholder at the bottom of each day's list.
`+ Add stop` — DM Sans 400 14px `var(--ink-3)`. Tap → `<BottomSheet>` with all fields.
On save: `upsert` to `stops` with correct `day` and `sort_order` at the end.

**Delete stop:** `<GhostButton>` `var(--nonveg)` at the bottom of each expanded card,
Abhay only. Tap → `<ConfirmSheet>` → delete from Supabase. Propagates via realtime.

---

## Screen 4 — Food

### Header

`Food Guide` — Cormorant Garamond 600 32px `var(--ink)`.
Three `<PillTab>` components: `All` · `Day 1` · `Day 2`.

### Diet Filter — Critical Logic

**Kashi's view:** non-veg items are absent. Not greyed, not locked. Simply not rendered.
If a restaurant has zero veg items, the entire `<RestaurantCard>` is absent from Kashi's view.

**Non-veg users:** all items shown. Below each veg item's name, a coordination hint:
```
Kashi can have this
```
DM Sans 300 12px `var(--veg)`. This helps the group coordinate ordering.

### `<RestaurantCard>` — Collapsed

`border: 0.5px solid var(--line)`. `border-radius: 12px`. `padding: 20px`.

```
[Name]                               [Veg-friendly pill — Kashi's view only]
[Meal type] · [Day] · [Time]
[Address]  ·  [Distance]
```

- Name: Cormorant Garamond 600 24px `var(--ink)`
- Meal type/day/time: DM Sans 300 13px `var(--ink-2)`
- Address: DM Sans 300 13px `var(--ink-2)`
- Distance: DM Mono 12px `var(--ink-3)`
- Veg-friendly pill: `background` `var(--veg)` at 10% opacity, `var(--veg)` text,
  DM Sans 400 11px, `border-radius: 999px`. Only shown when `activeUser === 'Kashi'`

### `<RestaurantCard>` — Expanded

`<MenuItem>` rows:
```
[8px dot]  [Item name]                  [Rs. 220]
           [Kashi can have this]        ← non-Kashi, veg items only
```

- Dot: `var(--veg)` or `var(--nonveg)` depending on diet
- Item name: DM Sans 400 14px `var(--ink)`
- Price: DM Mono 13px `var(--ink-2)`, right-aligned

**Nimrah Cafe special note** (when `has_cash_only_note === true`):
```
Cash only — carry small notes
```
DM Sans 300 13px `var(--amber)`. Below item list. No icon.

### Abhay — Food Edit Affordances

Restaurant-level: `<InlineEdit>` on name, meal type, day, time, address, distance.

Menu item level (edit mode):
- Item name → text input
- Price → DM Mono number input with `Rs.` prefix
- Diet → two-option pill toggle: `Veg / Non-veg`. Affects Kashi's view immediately.
- `×` at far right → removes item instantly, no confirmation

**Add menu item:** `+ Add item` dashed row at bottom of each expanded card. Inline form:
name input + price input + diet toggle. Blur/enter to save. Appends to `menu_items`.

**Add restaurant:** Dashed card at bottom of screen labeled `+ Add restaurant`.
Tap → `<BottomSheet>` with all restaurant fields.

**Delete restaurant:** `<GhostButton>` `var(--nonveg)`, Abhay only.
Tap → `<ConfirmSheet>` → delete from `restaurants` (cascades to `menu_items`).

---

## Screen 5 — Expenses

### Balance Calculation — Client-Side Only

```js
// Every expense: amount / split_with.length = each person's share

function computeBalances(expenses, settlements) {
  // Build raw debt map
  const owes = {} // owes[A][B] = how much A owes B

  expenses.forEach(exp => {
    const perPerson = exp.amount / exp.split_with.length
    exp.split_with.forEach(debtor => {
      if (debtor === exp.paid_by) return
      if (!owes[debtor]) owes[debtor] = {}
      owes[debtor][exp.paid_by] = (owes[debtor][exp.paid_by] || 0) + perPerson
    })
  })

  // Apply settlements
  settlements.forEach(s => {
    if (!owes[s.from_user]) owes[s.from_user] = {}
    owes[s.from_user][s.to_user] = (owes[s.from_user][s.to_user] || 0) - s.amount
  })

  // Collapse to net pairs — only return non-zero rows
  const results = []
  const processed = new Set()
  Object.keys(owes).forEach(a => {
    Object.keys(owes[a] || {}).forEach(b => {
      const key = [a, b].sort().join('|')
      if (processed.has(key)) return
      processed.add(key)
      const net = (owes[a]?.[b] || 0) - (owes[b]?.[a] || 0)
      if (Math.abs(net) >= 0.5) {
        results.push(net > 0
          ? { debtor: a, creditor: b, amount: Math.round(net) }
          : { debtor: b, creditor: a, amount: Math.round(-net) })
      }
    })
  })

  return results.sort((a, b) => b.amount - a.amount)
}
```

Recompute on every change to `expenses` or `settlements`. Never store computed
balances in Supabase.

### Summary Card

`background: var(--rust)`. White text. `padding: 24px`. `border-radius: 12px`.

```
TOTAL SPENT
Rs. 4,820

You paid          You owe
Rs. 1,200         Rs. 340
```

- `TOTAL SPENT`: DM Sans 400 11px `rgba(255,255,255,0.70)` `letter-spacing: 0.10em`
- Total: DM Mono 32px white
- `You paid` / `You owe` labels: DM Sans 300 12px `rgba(255,255,255,0.70)`
- Amounts: DM Mono 20px white
- "You paid" = sum of expenses where `paid_by === activeUser`
- "You owe" = sum of amounts where `activeUser` is the debtor

### Balance Section

`<SectionLabel text="BALANCES" />`

**Active user is debtor:**
- `border-left: 3px solid var(--nonveg)`
- `You owe Abhay  Rs. 340` — DM Sans 400 14px `var(--ink)`
- Right: `Settle` `<GhostButton>` `var(--rust)`

**Active user is creditor:**
- `border-left: 3px solid var(--veg)`
- `Bala owes you  Rs. 220` — DM Sans 400 14px `var(--ink)`
- No settle button

**Neither:**
- No accent border
- `Kashi owes Aswin  Rs. 180` — DM Sans 300 13px `var(--ink-3)`

**Settled rows:** strikethrough `var(--ink-3)`. `Settled` pill `var(--surface-2)` right side.

### Expense List

`<SectionLabel text="ALL EXPENSES" />`

Each `<ExpenseCard>`:
```
[Description]                              [Rs. 500]
[Paid by Name · Split: A, B, C]            [Jun 18, 5:42 PM]
[Category pill]
[Delete — only if paid_by === activeUser]
```

- Description: DM Sans 500 15px `var(--ink)`
- Paid by / split: DM Sans 300 13px `var(--ink-2)`
- Category pill: `background: var(--surface-2)`, DM Sans 400 12px `var(--ink-2)`,
  `border-radius: 999px`, `padding: 3px 10px`
- Amount: DM Mono 16px `var(--ink)`, right-aligned
- Timestamp: DM Mono 11px `var(--ink-3)`, right-aligned below amount
- Delete: `<GhostButton>` DM Sans 400 12px `var(--nonveg)`. Tap → `<ConfirmSheet>`.

### Add Expense FAB

`position: fixed`. `bottom: 88px`. `right: 20px`.
56px circle. `background: var(--rust)`. Lucide `Plus` 22px white. `border-radius: 50%`.
Tap → `<AddExpenseSheet>`.

### `<AddExpenseSheet>`

Title: `New Expense` — Cormorant Garamond 600 24px. `padding: 24px`.

Fields:
1. **Description** — text input. Placeholder: `What was this for?`
2. **Amount** — number input. `Rs.` as static prefix text in a flex wrapper.
   DM Mono for the number input.
3. **Paid by** — custom dropdown. Shows all 5 users with 32px `<Avatar>`.
   Opens as a slide-down list of 5 tappable rows. No native `<select>`.
4. **Split with** — 5 toggle rows. 32px `<Avatar>` + name + toggle switch right-aligned.
   All 5 toggled on by default.
5. **Category** — horizontal scroll of 5 pills: `Food` · `Travel` · `Entry` · `Hotel` ·
   `Other`. One active at a time. Active: `background: var(--ink)`, white text.

Bottom (always visible above keyboard):
- `Discard` — DM Sans 400 14px `var(--ink-3)` ghost, above primary
- `Add Expense` — `<PrimaryButton>` rust. Saves to `expenses`. Closes on success.
  Calls `showToast` on failure.

**Keyboard behaviour:** primary button stays pinned above the keyboard safe area
(`padding-bottom: env(safe-area-inset-bottom)`). Sheet scrolls internally.

### `<SettleSheet>`

Triggered by tapping `Settle` on a balance row.

Title: `Mark as settled?` — Cormorant Garamond 600 24px
Body: `You owe [Name]  Rs. [amount]` — DM Sans 400 14px `var(--ink-2)`
Sub: `This records the settlement and clears the debt.` — DM Sans 300 13px `var(--ink-3)`

Buttons: `Confirm settlement` `<PrimaryButton>` + `Cancel` ghost.

On confirm: insert into `settlements`. Recompute balances client-side.
Animate row to strikethrough. Show success toast: `Settlement recorded.`

---

## Screen 6 — More

Three sections, 24px gap between each. Sections: Packing List · Trip Tips · Emergency.

### Packing Checklist

`Packing List` — Cormorant Garamond 600 26px `var(--ink)`.

Progress row below heading:
- `8 of 18 packed` — DM Sans 400 13px `var(--ink-2)`. Numbers update live.
- Progress bar: full-width, 4px, `background: var(--line)`, fill `var(--rust)`,
  `border-radius: 999px`. Fill = `(checked / total) * 100%`.

Checklist grouped into categories. Category label: `<SectionLabel>`. Not interactive
(Abhay can pencil-edit category names).

Each `<ChecklistItem>`:
```
[Checkbox]  [Label]
```
- Unchecked: 20px square, `border: 1.5px solid var(--line-strong)`, `border-radius: 4px`
- Checked: `background: var(--rust)`, Lucide `Check` 12px white
- Checked label: `color: var(--ink-3)`, `text-decoration: line-through`
- Unchecked label: DM Sans 400 14px `var(--ink)`

State is per-user. Kashi's progress is fully independent of Abhay's.

```js
await supabase.from('checklist_items').upsert(
  { user_name: activeUser, item_id: item.id, checked: !item.checked },
  { onConflict: 'user_name,item_id' }
)
```

### Abhay — Checklist Edit Affordances

- Each item: pencil → `<InlineEdit>`. Enter/blur saves to `checklist_definitions`.
- Each item: `×` → delete from `checklist_definitions`.
  CASCADE in schema deletes all `checklist_items` rows for that item automatically.
- `+ Add item` row at the bottom of each category → inline input → blur/enter to save.
- Category label: pencil → `<InlineEdit>` → saves category name.
- `+ Add category` row below all categories → creates new empty category.

### Trip Tips

**Non-Abhay:** `Tips from Abhay` — Cormorant Garamond 600 26px.
**Abhay:** `Trip Tips` — Cormorant Garamond 600 26px.

Numbered list. No bullets, no icons, no cards.
Number: DM Mono `var(--rust)`, left of tip.
Tip text: DM Sans 400 14px `var(--ink)`, `line-height: 1.7`.
Numbers re-render automatically after any add or delete.

### Abhay — Trip Tips Edit Affordances

- Each tip: pencil → `<InlineEdit>` textarea. Save on blur/enter.
- Each tip: `×` → delete. No confirmation.
- `+ Add tip` at the bottom → inline input → appends.
- Numbers re-render automatically.

### Emergency Contacts

`Emergency` — Cormorant Garamond 600 26px `var(--ink)`.

Each row (entire row is an `<a href="tel:[number]">` link):
```
[Label]                        [Number]
```
- Label: DM Sans 400 14px `var(--ink-2)`
- Number: DM Mono 14px `var(--ink)`, right-aligned

Note below contacts:
```
Nearest hospital to Charminar: Osmania General Hospital, Afzalgunj
```
DM Sans 300 12px `var(--ink-3)`

### Abhay — Emergency Edit Affordances

- Each row: pencil → label and number become separate `<InlineEdit>` inputs.
- Each row: `×` → delete. No confirmation.
- `+ Add contact` at the bottom → appends.

---

## Abhay — Editor Mode Reference

`activeUser === 'Abhay'` → edit affordances appear inline. No toggle, no settings screen.

**The InlineEdit rule:** every editable field uses `<InlineEdit>`. Built once in Phase 2.
Never build a one-off inline input in a screen.

**What Abhay cannot edit:**
- User profiles (names, diet, personas, avatar colors) — fixed forever
- Expenses created by other users
- Visited stop toggles (shared group state)
- Group check-in state (shared group state)

**All edits:**
- Persist to Supabase immediately on blur/confirm
- Propagate to all five users via realtime subscriptions
- On write failure: `showToast('Couldn\'t save. Try again.')`

---

## Bottom Navigation Bar

Fixed to bottom. `background: var(--surface)`. `border-top: 0.5px solid var(--line)`.
Height: 64px.

Tabs: `Home · Plan · Food · Expenses · More`
Icons: `Home, CalendarDays, UtensilsCrossed, Receipt, MoreHorizontal`

Active tab: icon + label in `var(--rust)`. Label: DM Sans 500 11px.
Inactive tab: icon only in `var(--ink-3)`. No label.

---

## Seed Data — `src/seed.js`

### App Settings

```js
export const SEED_SETTINGS = [
  { key: 'countdown_target', value: '2026-06-18T16:00:00+05:30' },
  { key: 'hero_subtitle',    value: 'June 18 – 19  ·  5 people' },
  { key: 'weather_text',     value: 'Hyderabad on June 18  ·  38°C, Hot & Humid' },
  { key: 'weather_sub',      value: 'Carry water. Wear light cotton.' },
]
```

### Stops — June 18

```js
export const SEED_STOPS = [
  {
    id: 'stop-1', day: 1, sort_order: 1,
    time: '4:00 PM', date: '2026-06-18',
    name: 'Kacheguda Railway Station',
    location: 'Kacheguda', distance: 'Arrival point',
    entry_fee: 0, duration: null,
    description: 'Check into hotel. Hotel Geetanjali or FabHotel Necklace Road (Rs. 999–1,800/night). Book 2 rooms, split between 4.',
    photo_spot: null,
    abhay_note: 'Somajiguda area. Central to everything. Do not cheap out on location.',
    alternative_name: null, alternative_maps_url: null,
    directions_url: 'https://maps.google.com/?q=Kacheguda+Railway+Station',
  },
  {
    id: 'stop-2', day: 1, sort_order: 2,
    time: '5:00 PM', date: '2026-06-18',
    name: 'Nimrah Cafe & Bakery',
    location: 'Old City', distance: '6 km from station · 20 min · Rs. 120',
    entry_fee: 0, duration: '20 min',
    description: 'The most iconic Irani chai stop in Hyderabad. Standing room only. Cash only — carry Rs. 100 notes.',
    photo_spot: 'Charminar framed from across the road while drinking chai.',
    abhay_note: 'Cash only. Do not argue about it. Carry small notes.',
    alternative_name: 'Cafe Niloufer, Himayat Nagar',
    alternative_maps_url: 'https://maps.google.com/?q=Cafe+Niloufer+Himayat+Nagar',
    directions_url: 'https://maps.google.com/?q=Nimrah+Cafe+Hyderabad',
  },
  {
    id: 'stop-3', day: 1, sort_order: 3,
    time: '5:20 PM', date: '2026-06-18',
    name: 'Charminar + Laad Bazaar',
    location: 'Old City', distance: '2 min walk from Nimrah',
    entry_fee: 25, duration: '60–70 min',
    description: 'Climb inside for the rooftop view. Then walk Laad Bazaar for bangles, pearls, and attar. Look into Mecca Masjid next door.',
    photo_spot: 'Rooftop view of the bazaars at dusk.',
    abhay_note: 'Climb inside. The stairs are narrow. Alwin will complain. Go anyway.',
    alternative_name: 'Walk the exterior and bazaar for free if closed',
    alternative_maps_url: 'https://maps.google.com/?q=Charminar+Hyderabad',
    directions_url: 'https://maps.google.com/?q=Charminar+Hyderabad',
  },
  {
    id: 'stop-4', day: 1, sort_order: 4,
    time: '7:00 PM', date: '2026-06-18',
    name: 'Cafe Shadab',
    location: 'Old City', distance: '5 min walk from Charminar',
    entry_fee: 0, duration: '60 min',
    description: 'One of the oldest and most respected Hyderabadi restaurants. Sit down, order heavy, and take your time.',
    photo_spot: 'Interior wide shot — arched ceiling, full tables, old signage.',
    abhay_note: 'Order haleem even if you think you are full. You are never full.',
    alternative_name: 'Shah Ghouse, Tolichowki',
    alternative_maps_url: 'https://maps.google.com/?q=Shah+Ghouse+Tolichowki',
    directions_url: 'https://maps.google.com/?q=Cafe+Shadab+Hyderabad',
  },
  {
    id: 'stop-5', day: 1, sort_order: 5,
    time: '8:30 PM', date: '2026-06-18',
    name: 'Hussain Sagar + Lumbini Park',
    location: 'Necklace Road', distance: '10 km from Shadab · 20 min · Rs. 150',
    entry_fee: 170, duration: '90 min',
    description: 'Ferry to the Buddha statue in the middle of the lake. Laser show at 8:30 PM.',
    photo_spot: 'Buddha statue from the ferry at dusk.',
    abhay_note: 'Laser show at 8:30 PM. Gate by 8:15. Do not miss it.',
    alternative_name: 'Walk Necklace Road — free, still excellent',
    alternative_maps_url: 'https://maps.google.com/?q=Necklace+Road+Hyderabad',
    directions_url: 'https://maps.google.com/?q=Lumbini+Park+Hyderabad',
  },
  {
    id: 'stop-6', day: 1, sort_order: 6,
    time: '10:00 PM', date: '2026-06-18',
    name: 'Eat Street, Necklace Road',
    location: 'Necklace Road', distance: '2 min walk from Lumbini Park',
    entry_fee: 0, duration: '60 min',
    description: 'Late-night street food strip overlooking the lake. Good vibe to close the night.',
    photo_spot: null,
    abhay_note: 'Last stop of the night. Do not overeat. Two days of biryani ahead.',
    alternative_name: 'Any rooftop cafe on Banjara Hills',
    alternative_maps_url: 'https://maps.google.com/?q=Banjara+Hills+rooftop+cafes',
    directions_url: 'https://maps.google.com/?q=Eat+Street+Necklace+Road+Hyderabad',
  },
]
```

### Stops — June 19 (append to SEED_STOPS array)

```js
  {
    id: 'stop-7', day: 2, sort_order: 7,
    time: '10:00 AM', date: '2026-06-19',
    name: 'Chowmahalla Palace',
    location: 'Old City', distance: '6 km from hotel · 15 min · Rs. 100',
    entry_fee: 80, duration: '90 min',
    description: 'The former seat of the Nizam. Durbar Hall chandeliers, royal courtyards, and the vintage European car collection. Open 10 AM–5 PM. Closed Fridays. June 19 is Thursday — open.',
    photo_spot: 'Durbar Hall chandeliers from below. Vintage cars courtyard.',
    abhay_note: 'Do not rush this one. The Durbar Hall chandeliers are extraordinary.',
    alternative_name: 'Qutb Shahi Tombs (Rs. 15, 3 km) or Birla Mandir (free, hilltop views)',
    alternative_maps_url: 'https://maps.google.com/?q=Qutb+Shahi+Tombs+Hyderabad',
    directions_url: 'https://maps.google.com/?q=Chowmahalla+Palace+Hyderabad',
  },
  {
    id: 'stop-8', day: 2, sort_order: 8,
    time: '12:00 PM', date: '2026-06-19',
    name: 'Bawarchi',
    location: 'RTC Cross Road', distance: '5 km from Chowmahalla · 15 min · Rs. 90',
    entry_fee: 0, duration: '60 min',
    description: 'The original Bawarchi. No branches. Perfectly cooked biryani since 1978.',
    photo_spot: 'The kitchen window — steam, pots, controlled chaos.',
    abhay_note: 'This is the original. No branches. Anyone who says otherwise is wrong.',
    alternative_name: 'Cafe Bahar, Basheerbagh',
    alternative_maps_url: 'https://maps.google.com/?q=Cafe+Bahar+Basheerbagh',
    directions_url: 'https://maps.google.com/?q=Bawarchi+RTC+Cross+Road+Hyderabad',
  },
  {
    id: 'stop-9', day: 2, sort_order: 9,
    time: '2:00 PM', date: '2026-06-19',
    name: 'KBR National Park',
    location: 'Jubilee Hills', distance: '8 km from Bawarchi · 20 min · Rs. 130',
    entry_fee: 0, duration: '60 min',
    description: 'A forest reserve inside the city. 2.4 km walking trail under full canopy. Good recovery from the lunch biryani.',
    photo_spot: 'The canopy trail — dense, green, unexpectedly cinematic.',
    abhay_note: 'Post-lunch walk through a forest inside the city. Sounds boring. It is not.',
    alternative_name: 'Durgam Cheruvu (Secret Lake, Hitech City) — free, great for photos',
    alternative_maps_url: 'https://maps.google.com/?q=Durgam+Cheruvu+Hyderabad',
    directions_url: 'https://maps.google.com/?q=KBR+National+Park+Hyderabad',
  },
  {
    id: 'stop-10', day: 2, sort_order: 10,
    time: '4:00 PM', date: '2026-06-19',
    name: 'Chutneys, Banjara Hills',
    location: 'Banjara Hills', distance: '3 km from KBR · 10 min · Rs. 80',
    entry_fee: 0, duration: '45 min',
    description: 'South Indian snack break. Best pesarattu in the city.',
    photo_spot: 'Pesarattu on the table — crisp, green, with coconut chutney.',
    abhay_note: 'Pesarattu and filter coffee. This is mandatory.',
    alternative_name: 'Any cafe in Jubilee Hills',
    alternative_maps_url: 'https://maps.google.com/?q=cafes+Jubilee+Hills+Hyderabad',
    directions_url: 'https://maps.google.com/?q=Chutneys+Banjara+Hills+Hyderabad',
  },
  {
    id: 'stop-11', day: 2, sort_order: 11,
    time: '5:30 PM', date: '2026-06-19',
    name: 'Paradise Biryani',
    location: 'Secunderabad', distance: '8 km from Banjara Hills · 20 min · Rs. 130',
    entry_fee: 0, duration: '90 min',
    description: 'The original Paradise, open since 1953. The final meal of the trip. Order heavy. No regrets.',
    photo_spot: 'The dining hall — packed, noisy, legendary.',
    abhay_note: 'Last meal. Since 1953. Go hard.',
    alternative_name: 'Pista House (haleem) or Hotel Shadab Secunderabad branch',
    alternative_maps_url: 'https://maps.google.com/?q=Pista+House+Hyderabad',
    directions_url: 'https://maps.google.com/?q=Paradise+Biryani+Secunderabad',
  },
  {
    id: 'stop-12', day: 2, sort_order: 12,
    time: '8:30 PM', date: '2026-06-19',
    name: 'Secunderabad Railway Station',
    location: 'Secunderabad', distance: '2 km from Paradise · 5 min · Rs. 60',
    entry_fee: 0, duration: null,
    description: 'Departure. Board the train.',
    photo_spot: null, abhay_note: null,
    alternative_name: null, alternative_maps_url: null,
    directions_url: 'https://maps.google.com/?q=Secunderabad+Railway+Station',
  },
```

### Restaurants

```js
export const SEED_RESTAURANTS = [
  { id: 'rest-1', name: 'Nimrah Cafe & Bakery', meal_type: 'Evening snack', day: 1, time: '5:00 PM', address: 'Near Charminar, Old City', distance: '6 km from station', has_cash_only_note: true,  sort_order: 1 },
  { id: 'rest-2', name: 'Cafe Shadab',          meal_type: 'Dinner',        day: 1, time: '7:00 PM', address: '5 min walk from Charminar',   distance: '5 min walk',     has_cash_only_note: false, sort_order: 2 },
  { id: 'rest-3', name: 'Eat Street',           meal_type: 'Late night',    day: 1, time: '10:00 PM',address: 'Necklace Road',               distance: '2 min walk',     has_cash_only_note: false, sort_order: 3 },
  { id: 'rest-4', name: 'Bawarchi',             meal_type: 'Lunch',         day: 2, time: '12:00 PM',address: 'RTC Cross Road, Chikkadapally',distance: '5 km from Chowmahalla', has_cash_only_note: false, sort_order: 4 },
  { id: 'rest-5', name: 'Chutneys',             meal_type: 'Snack',         day: 2, time: '4:00 PM', address: 'Banjara Hills',               distance: '3 km from KBR',  has_cash_only_note: false, sort_order: 5 },
  { id: 'rest-6', name: 'Paradise Biryani',     meal_type: 'Dinner',        day: 2, time: '5:30 PM', address: 'Sarojini Devi Road, Secunderabad', distance: '8 km from Banjara Hills', has_cash_only_note: false, sort_order: 6 },
]
```

### Menu Items

```js
export const SEED_MENU_ITEMS = [
  // Nimrah
  { id: 'mi-1',  restaurant_id: 'rest-1', name: 'Irani Chai',            price: 25,  diet: 'veg',     sort_order: 1 },
  { id: 'mi-2',  restaurant_id: 'rest-1', name: 'Osmania Biscuits',      price: 30,  diet: 'veg',     sort_order: 2 },
  { id: 'mi-3',  restaurant_id: 'rest-1', name: 'Bun Maska',             price: 50,  diet: 'veg',     sort_order: 3 },
  // Shadab
  { id: 'mi-4',  restaurant_id: 'rest-2', name: 'Mutton Biryani',        price: 220, diet: 'non-veg', sort_order: 1 },
  { id: 'mi-5',  restaurant_id: 'rest-2', name: 'Seekh Kebabs',          price: 180, diet: 'non-veg', sort_order: 2 },
  { id: 'mi-6',  restaurant_id: 'rest-2', name: 'Haleem',                price: 150, diet: 'non-veg', sort_order: 3 },
  { id: 'mi-7',  restaurant_id: 'rest-2', name: 'Veg Biryani',           price: 150, diet: 'veg',     sort_order: 4 },
  { id: 'mi-8',  restaurant_id: 'rest-2', name: 'Paneer Butter Masala',  price: 160, diet: 'veg',     sort_order: 5 },
  { id: 'mi-9',  restaurant_id: 'rest-2', name: 'Sheermal',              price: 40,  diet: 'veg',     sort_order: 6 },
  { id: 'mi-10', restaurant_id: 'rest-2', name: 'Qubani Ka Meetha',      price: 80,  diet: 'veg',     sort_order: 7 },
  { id: 'mi-11', restaurant_id: 'rest-2', name: 'Double Ka Meetha',      price: 70,  diet: 'veg',     sort_order: 8 },
  // Eat Street
  { id: 'mi-12', restaurant_id: 'rest-3', name: 'Shawarma',              price: 120, diet: 'non-veg', sort_order: 1 },
  { id: 'mi-13', restaurant_id: 'rest-3', name: 'Sweet Corn Manchurian', price: 80,  diet: 'veg',     sort_order: 2 },
  { id: 'mi-14', restaurant_id: 'rest-3', name: 'Ice Cream Rolls',       price: 100, diet: 'veg',     sort_order: 3 },
  { id: 'mi-15', restaurant_id: 'rest-3', name: 'Paneer Tikka',          price: 140, diet: 'veg',     sort_order: 4 },
  { id: 'mi-16', restaurant_id: 'rest-3', name: 'Kulfi',                 price: 60,  diet: 'veg',     sort_order: 5 },
  // Bawarchi
  { id: 'mi-17', restaurant_id: 'rest-4', name: 'Chicken Biryani',       price: 260, diet: 'non-veg', sort_order: 1 },
  { id: 'mi-18', restaurant_id: 'rest-4', name: 'Mutton Biryani',        price: 320, diet: 'non-veg', sort_order: 2 },
  { id: 'mi-19', restaurant_id: 'rest-4', name: 'Chicken 65',            price: 220, diet: 'non-veg', sort_order: 3 },
  { id: 'mi-20', restaurant_id: 'rest-4', name: 'Veg Biryani',           price: 200, diet: 'veg',     sort_order: 4 },
  { id: 'mi-21', restaurant_id: 'rest-4', name: 'Dal Makhani',           price: 160, diet: 'veg',     sort_order: 5 },
  { id: 'mi-22', restaurant_id: 'rest-4', name: 'Butter Naan',           price: 40,  diet: 'veg',     sort_order: 6 },
  { id: 'mi-23', restaurant_id: 'rest-4', name: 'Lassi',                 price: 60,  diet: 'veg',     sort_order: 7 },
  // Chutneys
  { id: 'mi-24', restaurant_id: 'rest-5', name: 'Gongura Chicken',       price: 280, diet: 'non-veg', sort_order: 1 },
  { id: 'mi-25', restaurant_id: 'rest-5', name: 'Pesarattu',             price: 120, diet: 'veg',     sort_order: 2 },
  { id: 'mi-26', restaurant_id: 'rest-5', name: 'Masala Dosa',           price: 110, diet: 'veg',     sort_order: 3 },
  { id: 'mi-27', restaurant_id: 'rest-5', name: 'Idli Sambar',           price: 80,  diet: 'veg',     sort_order: 4 },
  { id: 'mi-28', restaurant_id: 'rest-5', name: 'Filter Coffee',         price: 50,  diet: 'veg',     sort_order: 5 },
  // Paradise
  { id: 'mi-29', restaurant_id: 'rest-6', name: 'Chicken Supreme Biryani', price: 300, diet: 'non-veg', sort_order: 1 },
  { id: 'mi-30', restaurant_id: 'rest-6', name: 'Mutton Biryani',          price: 360, diet: 'non-veg', sort_order: 2 },
  { id: 'mi-31', restaurant_id: 'rest-6', name: 'Nihari',                  price: 200, diet: 'non-veg', sort_order: 3 },
  { id: 'mi-32', restaurant_id: 'rest-6', name: 'Veg Dum Biryani',         price: 220, diet: 'veg',     sort_order: 4 },
  { id: 'mi-33', restaurant_id: 'rest-6', name: 'Paneer Masala',           price: 180, diet: 'veg',     sort_order: 5 },
  { id: 'mi-34', restaurant_id: 'rest-6', name: 'Lassi Faluda',            price: 80,  diet: 'veg',     sort_order: 6 },
]
```

### Checklist Definitions

```js
export const SEED_CHECKLIST = [
  // Clothes
  { id: 'cl-1', category: 'Clothes',     label: 'Light cotton clothes (2 days)', sort_order: 1 },
  { id: 'cl-2', category: 'Clothes',     label: 'Extra footwear',                sort_order: 2 },
  { id: 'cl-3', category: 'Clothes',     label: 'Sunglasses',                    sort_order: 3 },
  // Essentials
  { id: 'cl-4', category: 'Essentials',  label: 'Sunscreen SPF 50+',             sort_order: 4 },
  { id: 'cl-5', category: 'Essentials',  label: 'Refillable water bottle',       sort_order: 5 },
  { id: 'cl-6', category: 'Essentials',  label: 'Power bank',                    sort_order: 6 },
  { id: 'cl-7', category: 'Essentials',  label: 'Earphones',                     sort_order: 7 },
  { id: 'cl-8', category: 'Essentials',  label: 'ID proof',                      sort_order: 8 },
  { id: 'cl-9', category: 'Essentials',  label: 'Cash (min Rs. 2,000)',          sort_order: 9 },
  { id: 'cl-10',category: 'Essentials',  label: 'UPI apps ready',                sort_order: 10 },
  // Health
  { id: 'cl-11',category: 'Health',      label: 'ORS packets',                   sort_order: 11 },
  { id: 'cl-12',category: 'Health',      label: 'Paracetamol',                   sort_order: 12 },
  { id: 'cl-13',category: 'Health',      label: 'Antacid',                       sort_order: 13 },
  { id: 'cl-14',category: 'Health',      label: 'Hand sanitiser',                sort_order: 14 },
  // Travel
  { id: 'cl-15',category: 'Travel',      label: 'Train ticket downloaded',       sort_order: 15 },
  { id: 'cl-16',category: 'Travel',      label: 'Hotel booking confirmed',       sort_order: 16 },
  { id: 'cl-17',category: 'Travel',      label: 'Hyderabad offline map downloaded', sort_order: 17 },
  { id: 'cl-18',category: 'Travel',      label: 'Uber app installed',            sort_order: 18 },
]
```

### Trip Tips

```js
export const SEED_TIPS = [
  { id: undefined, content: 'UPI works everywhere in Old City, even at bangle stalls',                                          sort_order: 1 },
  { id: undefined, content: 'Always book Uber or Ola via app — never negotiate with auto drivers near tourist spots',           sort_order: 2 },
  { id: undefined, content: 'Cover shoulders at Charminar and Mecca Masjid',                                                   sort_order: 3 },
  { id: undefined, content: 'Carry Rs. 100 and Rs. 50 notes — Old City vendors struggle with large bills',                     sort_order: 4 },
  { id: undefined, content: 'June heat peaks between 11 AM and 4 PM. Carry water at all times',                                sort_order: 5 },
  { id: undefined, content: 'At Laad Bazaar, start bargaining at 40% of the quoted price',                                     sort_order: 6 },
]
```

Note: `trip_tips.id` is a UUID generated by Supabase. Omit the id field in the insert,
or pass `undefined` — Supabase will generate it.

### Emergency Contacts

```js
export const SEED_CONTACTS = [
  { id: undefined, label: 'Police',                number: '100',           sort_order: 1 },
  { id: undefined, label: 'Ambulance',             number: '108',           sort_order: 2 },
  { id: undefined, label: 'Hyderabad helpline',    number: '040-27852425',  sort_order: 3 },
  { id: undefined, label: 'Osmania General Hospital', number: '040-24600177', sort_order: 4 },
]
```

---

## What This Must Not Look Like

- A Tailwind starter template with uniform rounded cards on a white page
- Any generic travel app with blue headers or stock illustrations
- An AI-generated interface: uniform spacing, identical card heights, predictable layout
- A dashboard with tables, stat grids, or chart blocks
- Any screen containing an emoji — not in UI, not in strings, not in data
- Hero cards with external images, illustration packs, or AI art
- Any font other than Cormorant Garamond, DM Sans, and DM Mono
- Native `<select>` dropdowns, `alert()`, `confirm()`, or `prompt()`
- Error states that break the visual design (red boxes, raw stack traces, error objects)
- Any `console.log` left in production code
- Hardcoded hex values in component files — always use CSS variables

---

## The Standard

Every screen should look like it was designed by a senior product designer who has
studied editorial print seriously. Warm, restrained, typographically precise.

The kind of app this group opens every hour of the trip — not because they have to,
but because it feels better than anything else on their phone.

The name **HydRip** appears once: on the picker screen. After that, the app gets out
of the way and lets the trip speak for itself.