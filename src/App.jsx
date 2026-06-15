import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  Check,
  ChevronDown,
  Home as HomeIcon,
  MoreHorizontal,
  Plus,
  Receipt,
  Sun,
  UtensilsCrossed,
  X,
} from 'lucide-react'
import {
  Avatar,
  BottomSheet,
  ConfirmSheet,
  GhostButton,
  InlineEdit,
  PillTab,
  PillTag,
  PrimaryButton,
  SectionLabel,
  useToast,
} from './components'
import { seedIfEmpty, SEED_SETTINGS } from './seed'
import { supabase } from './supabase'
import { getUser, USERS } from './users'

const FALLBACK_DURATION_MIN = 90

const TABS = [
  { id: 'home', label: 'Home', icon: HomeIcon },
  { id: 'plan', label: 'Plan', icon: CalendarDays },
  { id: 'food', label: 'Food', icon: UtensilsCrossed },
  { id: 'expenses', label: 'Expenses', icon: Receipt },
  { id: 'more', label: 'More', icon: MoreHorizontal },
]

const CATEGORIES = ['Food', 'Travel', 'Entry', 'Hotel', 'Other']

const DEFAULT_SETTINGS = SEED_SETTINGS.reduce((acc, setting) => {
  acc[setting.key] = setting.value
  return acc
}, {})

function formatMoney(value) {
  return `Rs. ${Number(value || 0).toLocaleString('en-IN')}`
}

function parseDurationToMinutes(duration) {
  if (!duration) return null
  const match = String(duration).match(/\d+/)
  return match ? Number(match[0]) : null
}

function parseStopDate(stop) {
  if (!stop?.date || !stop?.time) return new Date(0)
  const [year, month, day] = stop.date.split('-').map(Number)
  const match = stop.time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return new Date(stop.date)
  let hour = Number(match[1])
  const minute = Number(match[2])
  const period = match[3].toUpperCase()
  if (period === 'PM' && hour !== 12) hour += 12
  if (period === 'AM' && hour === 12) hour = 0
  return new Date(year, month - 1, day, hour, minute)
}

function getStopEnd(stop) {
  const durationMin = parseDurationToMinutes(stop.duration) || FALLBACK_DURATION_MIN
  return new Date(parseStopDate(stop).getTime() + durationMin * 60000)
}

function getActiveOrNextStop(stops, now = new Date()) {
  for (const stop of [...stops].sort((a, b) => a.sort_order - b.sort_order)) {
    const start = parseStopDate(stop)
    const end = getStopEnd(stop)
    if (now >= start && now < end) return { stop, status: 'active' }
    if (now < start) return { stop, status: 'upcoming' }
  }
  return null
}

function isTripComplete(stops, now = new Date()) {
  if (!stops.length) return false
  const lastStop = [...stops].sort((a, b) => a.sort_order - b.sort_order).at(-1)
  return now > getStopEnd(lastStop)
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function settingsToMap(settings) {
  return settings.reduce((acc, item) => {
    acc[item.key] = item.value
    return acc
  }, { ...DEFAULT_SETTINGS })
}

function useWrite() {
  const { showToast } = useToast()

  return async (request, successMessage) => {
    const { error } = await request
    if (error) {
      showToast('Couldn\'t save. Try again.')
      return false
    }
    if (successMessage) showToast(successMessage)
    return true
  }
}

function EmptyState() {
  return <div className="empty-state">Nothing here yet.</div>
}

function QuietError({ label }) {
  return <p className="quiet-error">Could not load {label}. Pull down to retry.</p>
}

export default function App() {
  const [ready, setReady] = useState(false)
  const [activeUserName, setActiveUserName] = useState(() => localStorage.getItem('userName'))
  const [activeTab, setActiveTab] = useState('home')

  useEffect(() => {
    let mounted = true
    seedIfEmpty().finally(() => {
      if (mounted) setReady(true)
    })
    return () => {
      mounted = false
    }
  }, [])

  const activeUser = activeUserName ? getUser(activeUserName) : null

  const handlePickUser = (name) => {
    localStorage.setItem('userName', name)
    setActiveUserName(name)
    setActiveTab('home')
  }

  const handleSwitchUser = () => {
    localStorage.removeItem('userName')
    setActiveUserName(null)
    setActiveTab('home')
  }

  if (!ready) return <div className="app-frame" />

  if (!activeUser) {
    return <UserPicker onPick={handlePickUser} />
  }

  return (
    <div className="app-frame">
      {activeTab === 'home' && <HomeScreen activeUser={activeUser} onSwitch={handleSwitchUser} setActiveTab={setActiveTab} />}
      {activeTab === 'plan' && <PlanScreen activeUser={activeUser} onSwitch={handleSwitchUser} />}
      {activeTab === 'food' && <FoodScreen activeUser={activeUser} onSwitch={handleSwitchUser} />}
      {activeTab === 'expenses' && <ExpensesScreen activeUser={activeUser} onSwitch={handleSwitchUser} />}
      {activeTab === 'more' && <MoreScreen activeUser={activeUser} onSwitch={handleSwitchUser} />}
      <BottomNav activeTab={activeTab} onChange={setActiveTab} />
    </div>
  )
}

function UserPicker({ onPick }) {
  return (
    <div className="app-frame">
      <div
        style={{
          minHeight: '100vh',
          padding: '32px 20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ color: 'var(--ink-3)', fontSize: 11, fontWeight: 400, letterSpacing: '0.12em', marginBottom: 14 }}>
            HYDERABAD - JUNE 18-19
          </div>
          <div className="display" style={{ color: 'var(--ink-3)', fontSize: 18, fontWeight: 600, fontStyle: 'italic', marginBottom: 8 }}>
            HydRip
          </div>
          <h1 className="display" style={{ margin: 0, fontSize: 36, fontWeight: 600 }}>
            Who's travelling?
          </h1>
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          {USERS.map((user) => (
            <button
              type="button"
              key={user.name}
              onClick={() => onPick(user.name)}
              className="card"
              style={{
                padding: '16px 20px',
                display: 'grid',
                gridTemplateColumns: '48px 1fr 10px',
                alignItems: 'center',
                gap: 16,
                textAlign: 'left',
                transition: 'background 260ms cubic-bezier(0.16, 1, 0.3, 1), transform 260ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <Avatar user={user} size={48} />
              <span>
                <span style={{ display: 'block', color: 'var(--ink)', fontSize: 17, fontWeight: 500 }}>{user.name}</span>
                {user.persona && <span style={{ display: 'block', color: 'var(--ink-2)', fontSize: 13, fontWeight: 300 }}>{user.persona}</span>}
              </span>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: user.diet === 'veg' ? 'var(--veg)' : 'var(--nonveg)' }} />
            </button>
          ))}
        </div>

        <p style={{ margin: '28px 0 0', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13, fontWeight: 300 }}>
          You can switch anytime from any screen
        </p>
      </div>
    </div>
  )
}

function TopBar({ activeUser, onSwitch }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Avatar user={activeUser} size={32} />
        <span style={{ color: 'var(--ink)', fontSize: 16, fontWeight: 500 }}>{activeUser.name}</span>
      </div>
      <button
        type="button"
        onClick={onSwitch}
        style={{
          border: 'none',
          background: 'transparent',
          color: 'var(--ink-3)',
          fontSize: 13,
          fontWeight: 400,
          padding: 0,
        }}
      >
        Switch
      </button>
    </div>
  )
}

function BottomNav({ activeTab, onChange }) {
  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 430,
        height: 64,
        background: 'var(--surface)',
        borderTop: '0.5px solid var(--line)',
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        zIndex: 50,
      }}
    >
      {TABS.map((tab) => {
        const Icon = tab.icon
        const active = activeTab === tab.id
        return (
          <button
            type="button"
            key={tab.id}
            onClick={() => onChange(tab.id)}
            aria-label={tab.label}
            style={{
              border: 'none',
              background: 'transparent',
              color: active ? 'var(--rust)' : 'var(--ink-3)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              fontSize: 11,
              fontWeight: 500,
            }}
          >
            <Icon size={21} strokeWidth={1.8} />
            {active && <span>{tab.label}</span>}
          </button>
        )
      })}
    </nav>
  )
}

function HomeScreen({ activeUser, onSwitch, setActiveTab }) {
  const write = useWrite()
  const [stops, setStops] = useState([])
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [checkedIn, setCheckedIn] = useState([])
  const [error, setError] = useState('')
  const [now, setNow] = useState(new Date())
  const [aswinExplored, setAswinExplored] = useState(false)

  const isAbhay = activeUser.name === 'Abhay'
  const stopInfo = useMemo(() => getActiveOrNextStop(stops, now), [stops, now])
  const currentStop = stopInfo?.stop || null
  const checkedInUsers = currentStop ? checkedIn.filter((row) => row.stop_id === currentStop.id).map((row) => row.user_name) : []
  const tripComplete = isTripComplete(stops, now)

  const fetchData = async () => {
    const [stopsResult, checkedResult, settingsResult] = await Promise.all([
      supabase.from('stops').select('*').order('sort_order'),
      supabase.from('checked_in').select('*'),
      supabase.from('app_settings').select('*'),
    ])
    if (stopsResult.error || checkedResult.error || settingsResult.error) {
      setError('home')
      return
    }
    setStops(stopsResult.data || [])
    setCheckedIn(checkedResult.data || [])
    setSettings(settingsToMap(settingsResult.data || []))
    setError('')
  }

  useEffect(() => {
    fetchData()
    const channel = supabase
      .channel('home-screen')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stops' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checked_in' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, fetchData)
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const saveSetting = (key, value) => write(supabase.from('app_settings').upsert({ key, value: String(value) }, { onConflict: 'key' }))
  const saveStop = (id, patch) => write(supabase.from('stops').update(patch).eq('id', id))

  const toggleCheckIn = async (userName) => {
    if (!currentStop || userName !== activeUser.name) return
    const isCheckedIn = checkedInUsers.includes(activeUser.name)
    if (isCheckedIn) {
      await write(supabase.from('checked_in').delete().eq('stop_id', currentStop.id).eq('user_name', activeUser.name))
    } else {
      await write(supabase.from('checked_in').upsert({ stop_id: currentStop.id, user_name: activeUser.name }))
    }
  }

  return (
    <>
      <main className="screen" style={activeUser.name === 'Aswin' && !aswinExplored ? { filter: 'blur(8px)', pointerEvents: 'none', userSelect: 'none', overflow: 'hidden', height: '100vh' } : {}}>
        <TopBar activeUser={activeUser} onSwitch={onSwitch} />
        {error && <QuietError label="trip details" />}
        <section style={{ display: 'grid', gap: 32 }}>
          <HeroCard settings={settings} isAbhay={isAbhay} saveSetting={saveSetting} now={now} tripComplete={tripComplete} />
          <WeatherStrip settings={settings} isAbhay={isAbhay} saveSetting={saveSetting} />
          <section>
            <SectionLabel text="NEXT STOP" />
            {currentStop ? (
              <div className="card" style={{ borderLeft: '3px solid var(--rust)', padding: 20 }}>
                <h2 className="display" style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>
                  {currentStop.name}
                </h2>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
                  <span className="mono" style={{ color: 'var(--ink-2)', fontSize: 13 }}>{currentStop.time}</span>
                  {currentStop.distance && <span className="mono" style={{ color: 'var(--ink-3)', fontSize: 13 }}>{currentStop.distance}</span>}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                  <GhostButton label="View full plan" onClick={() => setActiveTab('plan')} />
                </div>
              </div>
            ) : (
              <EmptyState />
            )}
          </section>
          <section>
            <SectionLabel text="AT THIS STOP" />
            {currentStop ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {USERS.map((user) => (
                  <Avatar
                    key={user.name}
                    user={user}
                    size={32}
                    outlined={checkedInUsers.includes(user.name)}
                    onClick={user.name === activeUser.name ? () => toggleCheckIn(user.name) : undefined}
                  />
                ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </section>
          <QuickLinks setActiveTab={setActiveTab} />
        </section>
      </main>
      {activeUser.name === 'Aswin' && !aswinExplored && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255, 255, 255, 0.4)' }}>
          <div style={{ background: 'var(--surface)', padding: 24, borderRadius: 12, textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', maxWidth: '80%' }}>
            <p style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 500, color: 'var(--ink)' }}>take care pnumonia patient.</p>
            <button type="button" onClick={() => setAswinExplored(true)} style={{ background: 'transparent', border: '1px solid var(--ink)', padding: '6px 12px', borderRadius: 6, fontSize: 14, cursor: 'pointer' }}>
              explore
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function HeroCard({ settings, isAbhay, saveSetting, now, tripComplete }) {
  const countdownTarget = settings.countdown_target || DEFAULT_SETTINGS.countdown_target
  const target = new Date(countdownTarget)
  const diff = target - now
  const seconds = Math.max(0, Math.floor(diff / 1000))
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (tripComplete) {
    return (
      <section style={{ background: 'var(--surface-2)', borderRadius: 12, padding: 24 }}>
        <h1 className="display" style={{ margin: 0, color: 'var(--ink)', fontSize: 28, fontWeight: 600 }}>Trip complete</h1>
        <p style={{ margin: '8px 0 0', color: 'var(--ink-2)', fontSize: 14, fontWeight: 300 }}>June 18-19, Hyderabad</p>
      </section>
    )
  }

  return (
    <section style={{ background: 'var(--rust)', borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'relative', zIndex: 1, padding: 24, paddingBottom: 80 }}>
        <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: 400, letterSpacing: '0.12em' }}>GROUP TRIP</div>
        <h1 className="display" style={{ margin: '8px 0 8px', color: 'var(--surface)', fontSize: 42, fontWeight: 600 }}>Hyderabad</h1>
        <div style={{ color: 'rgba(255,255,255,0.80)', fontSize: 14, fontWeight: 300 }}>
          {isAbhay ? (
            <InlineEdit
              value={settings.hero_subtitle}
              onSave={(value) => saveSetting('hero_subtitle', value)}
              style={{ color: 'rgba(255,255,255,0.80)', fontSize: 14, fontWeight: 300 }}
            />
          ) : settings.hero_subtitle}
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.20)', margin: '16px 0' }} />
        {diff > 0 ? (
          <>
            <div style={{ color: 'rgba(255,255,255,0.60)', fontSize: 10, fontWeight: 400, letterSpacing: '0.10em', marginBottom: 10 }}>
              DEPARTING IN
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {[
                ['d', days],
                ['h', hours],
                ['m', minutes],
                ['s', secs],
              ].map(([unit, value]) => (
                <div key={unit}>
                  <div className="mono" style={{ color: 'var(--surface)', fontSize: 28 }}>{String(value).padStart(2, '0')}</div>
                  <div style={{ color: 'rgba(255,255,255,0.60)', fontSize: 11, fontWeight: 300 }}>{unit}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="mono" style={{ color: 'var(--surface)', fontSize: 20 }}>Trip is on</div>
        )}
        {isAbhay && (
          <div style={{ marginTop: 16, color: 'rgba(255,255,255,0.80)', fontSize: 12 }}>
            <span style={{ display: 'block', marginBottom: 4, letterSpacing: '0.10em', fontSize: 10 }}>COUNTDOWN TARGET</span>
            <InlineEdit
              value={countdownTarget.slice(0, 16)}
              inputType="datetime-local"
              onSave={(value) => saveSetting('countdown_target', value.length === 16 ? `${value}:00+05:30` : value)}
              style={{ color: 'rgba(255,255,255,0.80)', fontFamily: '"DM Mono", monospace', fontSize: 12 }}
            />
          </div>
        )}
      </div>
      <Skyline />
    </section>
  )
}

function Skyline() {
  return (
    <svg viewBox="0 0 430 72" xmlns="http://www.w3.org/2000/svg" style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 72, zIndex: 0 }}>
      <rect x="175" y="20" width="6" height="52" fill="#A83A0C" />
      <rect x="249" y="20" width="6" height="52" fill="#A83A0C" />
      <rect x="192" y="28" width="6" height="44" fill="#A83A0C" />
      <rect x="232" y="28" width="6" height="44" fill="#A83A0C" />
      <rect x="181" y="32" width="68" height="40" fill="#A83A0C" />
      <polygon points="178,20 181,32 175,32" fill="#A83A0C" />
      <polygon points="252,20 255,32 249,32" fill="#A83A0C" />
      <polygon points="195,28 198,36 192,36" fill="#A83A0C" />
      <polygon points="235,28 238,36 232,36" fill="#A83A0C" />
      <ellipse cx="215" cy="44" rx="12" ry="8" fill="#A83A0C" />
      <rect x="320" y="48" width="24" height="8" fill="#A83A0C" />
      <rect x="326" y="36" width="12" height="12" fill="#A83A0C" />
      <ellipse cx="332" cy="34" rx="8" ry="10" fill="#A83A0C" />
      <rect x="329" y="24" width="6" height="10" fill="#A83A0C" />
      <ellipse cx="332" cy="22" rx="5" ry="5" fill="#A83A0C" />
      <rect x="60" y="40" width="40" height="32" fill="#A83A0C" />
      <ellipse cx="80" cy="40" rx="20" ry="14" fill="#A83A0C" />
      <rect x="78" y="24" width="4" height="16" fill="#A83A0C" />
      <rect x="0" y="68" width="430" height="4" fill="#A83A0C" />
      <rect x="0" y="50" width="50" height="22" fill="#A83A0C" />
      <rect x="110" y="44" width="55" height="28" fill="#A83A0C" />
      <rect x="360" y="42" width="70" height="30" fill="#A83A0C" />
    </svg>
  )
}

function WeatherStrip({ settings, isAbhay, saveSetting }) {
  return (
    <section
      style={{
        background: 'var(--rust-light)',
        border: '0.5px solid rgba(193,68,14,0.20)',
        borderRadius: 12,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <Sun size={18} color="var(--rust)" />
      <div style={{ minWidth: 0 }}>
        <div style={{ color: 'var(--ink)', fontSize: 14, fontWeight: 400 }}>
          {isAbhay ? <InlineEdit value={settings.weather_text} onSave={(value) => saveSetting('weather_text', value)} /> : settings.weather_text}
        </div>
        <div style={{ color: 'var(--ink-2)', fontSize: 13, fontWeight: 300, marginTop: 2 }}>
          {isAbhay ? <InlineEdit value={settings.weather_sub} onSave={(value) => saveSetting('weather_sub', value)} /> : settings.weather_sub}
        </div>
      </div>
    </section>
  )
}

function QuickLinks({ setActiveTab }) {
  const links = [
    ['Today\'s Plan', 'plan'],
    ['Food Guide', 'food'],
    ['Expenses', 'expenses'],
    ['Checklist', 'more'],
  ]

  return (
    <div className="scroll-row" style={{ display: 'flex', gap: 8, paddingBottom: 2 }}>
      {links.map(([label, tab]) => (
        <button
          type="button"
          key={label}
          onClick={() => setActiveTab(tab)}
          style={{
            background: 'var(--surface)',
            border: '0.5px solid var(--line)',
            borderRadius: 999,
            padding: '8px 16px',
            color: 'var(--ink)',
            fontSize: 14,
            fontWeight: 400,
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function PlanScreen({ activeUser, onSwitch }) {
  const write = useWrite()
  const [day, setDay] = useState(1)
  const [stops, setStops] = useState([])
  const [visited, setVisited] = useState([])
  const [checkedIn, setCheckedIn] = useState([])
  const [error, setError] = useState('')
  const [addDay, setAddDay] = useState(null)

  const isAbhay = activeUser.name === 'Abhay'
  const dayStops = stops.filter((stop) => stop.day === day)
  const visitedMap = useMemo(() => Object.fromEntries(visited.map((row) => [row.stop_id, row.visited])), [visited])

  const fetchData = async () => {
    const [stopsResult, visitedResult, checkedResult] = await Promise.all([
      supabase.from('stops').select('*').order('sort_order'),
      supabase.from('visited_stops').select('*'),
      supabase.from('checked_in').select('*'),
    ])
    if (stopsResult.error || visitedResult.error || checkedResult.error) {
      setError('plan')
      return
    }
    setStops(stopsResult.data || [])
    setVisited(visitedResult.data || [])
    setCheckedIn(checkedResult.data || [])
    setError('')
  }

  useEffect(() => {
    fetchData()
    const channel = supabase
      .channel('plan-screen')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stops' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visited_stops' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checked_in' }, fetchData)
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const updateStop = (id, patch) => write(supabase.from('stops').update(patch).eq('id', id))
  const deleteStop = (id) => write(supabase.from('stops').delete().eq('id', id))
  const toggleVisited = (stop) => write(supabase.from('visited_stops').upsert({
    stop_id: stop.id,
    visited: !visitedMap[stop.id],
    visited_at: new Date().toISOString(),
  }, { onConflict: 'stop_id' }))

  const addStop = async (payload) => {
    const maxSort = Math.max(0, ...stops.map((stop) => Number(stop.sort_order) || 0))
    return write(supabase.from('stops').upsert({
      id: makeId('stop'),
      day: addDay,
      sort_order: maxSort + 1,
      date: addDay === 1 ? '2025-06-18' : '2025-06-19',
      ...payload,
    }, { onConflict: 'id' }))
  }

  return (
    <main className="screen">
      <TopBar activeUser={activeUser} onSwitch={onSwitch} />
      <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
        <h1 className="display" style={{ margin: 0, fontSize: 32, fontWeight: 600 }}>The Plan</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <PillTab label="Jun 18" active={day === 1} onClick={() => setDay(1)} />
          <PillTab label="Jun 19" active={day === 2} onClick={() => setDay(2)} />
        </div>
      </header>
      {error && <QuietError label="plan" />}
      <div style={{ display: 'grid', gap: 12 }}>
        {dayStops.length ? dayStops.map((stop) => (
          <div key={stop.id} style={{ display: 'grid', gridTemplateColumns: '56px 24px 1fr', gap: 0 }}>
            <div className="mono" style={{ color: 'var(--ink-3)', fontSize: 12, paddingTop: 26 }}>{isAbhay ? (
              <InlineEdit value={stop.time} onSave={(value) => updateStop(stop.id, { time: value })} style={{ fontFamily: '"DM Mono", monospace', fontSize: 12, color: 'var(--ink-3)' }} />
            ) : stop.time}</div>
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: 1, minHeight: '100%', borderLeft: '1px dashed var(--line-strong)' }} />
              <div style={{ position: 'absolute', top: 31, width: 10, height: 10, borderRadius: '50%', background: 'var(--rust)' }} />
            </div>
            <StopCard
              stop={stop}
              isAbhay={isAbhay}
              visited={Boolean(visitedMap[stop.id])}
              checkedIn={checkedIn.filter((row) => row.stop_id === stop.id)}
              onUpdate={updateStop}
              onDelete={deleteStop}
              onToggleVisited={() => toggleVisited(stop)}
            />
          </div>
        )) : <EmptyState />}
        {isAbhay && (
          <button
            type="button"
            onClick={() => setAddDay(day)}
            style={{
              border: '0.5px dashed var(--line-strong)',
              borderRadius: 12,
              background: 'transparent',
              color: 'var(--ink-3)',
              padding: 18,
              fontSize: 14,
              fontWeight: 400,
            }}
          >
            + Add stop
          </button>
        )}
      </div>
      <AddStopSheet open={Boolean(addDay)} onClose={() => setAddDay(null)} onSave={addStop} />
    </main>
  )
}

function StopCard({ stop, isAbhay, visited, onUpdate, onDelete, onToggleVisited }) {
  const [expanded, setExpanded] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const saveField = (field, transform = (value) => value) => (value) => onUpdate(stop.id, { [field]: transform(value) })

  return (
    <article
      className="card"
      onClick={() => setExpanded((value) => !value)}
      style={{
        padding: 16,
        overflow: 'hidden',
        transition: 'max-height 260ms cubic-bezier(0.16, 1, 0.3, 1), background 260ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 28px', gap: 12, alignItems: 'start' }}>
        <h2 className="display" style={{ margin: 0, color: 'var(--ink)', fontSize: 18, fontWeight: 600 }}>
          {isAbhay ? <InlineEdit value={stop.name} onSave={saveField('name')} style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em' }} /> : stop.name}
        </h2>
        <button
          type="button"
          aria-label="Toggle visited"
          onClick={(e) => {
            e.stopPropagation()
            onToggleVisited()
          }}
          style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            border: visited ? 'none' : '1.5px solid var(--line-strong)',
            background: visited ? 'var(--veg)' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 2,
          }}
        >
          {visited && <Check size={12} color="var(--surface)" />}
        </button>
      </div>
      <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', color: 'var(--ink-2)', fontSize: 13, fontWeight: 300 }}>
        {isAbhay ? <InlineEdit value={stop.location || ''} onSave={saveField('location')} placeholder="Location" /> : stop.location}
        {stop.distance && <span style={{ color: 'var(--ink-3)' }}>·</span>}
        {isAbhay ? (
          <span className="mono" style={{ color: 'var(--ink-3)', fontSize: 12 }}>
            <InlineEdit value={stop.distance || ''} onSave={saveField('distance')} placeholder="Distance" style={{ fontFamily: '"DM Mono", monospace', fontSize: 12, color: 'var(--ink-3)' }} />
          </span>
        ) : stop.distance ? <span className="mono" style={{ color: 'var(--ink-3)', fontSize: 12 }}>{stop.distance}</span> : null}
      </div>
      {(Number(stop.entry_fee) > 0 || isAbhay) && (
        <div style={{ marginTop: 10 }}>
          <span style={{ background: 'var(--amber-light)', borderRadius: 999, padding: '3px 10px', color: 'var(--amber)', fontSize: 12, fontWeight: 400 }}>
            <span className="mono">
              {isAbhay ? (
                <InlineEdit value={stop.entry_fee ?? 0} inputType="number" onSave={saveField('entry_fee', (value) => Number(value) || 0)} style={{ fontFamily: '"DM Mono", monospace', color: 'var(--amber)', fontSize: 12 }} />
              ) : formatMoney(stop.entry_fee)}
            </span>
          </span>
        </div>
      )}
      {expanded && (
        <div onClick={(e) => e.stopPropagation()} style={{ marginTop: 16, paddingTop: 16, borderTop: '0.5px solid var(--line)' }}>
          {isAbhay && (
            <div style={{ color: 'var(--ink-3)', fontSize: 12, marginBottom: 12 }}>
              Duration:{' '}
              <InlineEdit value={stop.duration || ''} onSave={saveField('duration')} placeholder="Duration" style={{ color: 'var(--ink-3)', fontSize: 12 }} />
            </div>
          )}
          <p style={{ margin: 0, color: 'var(--ink-2)', fontSize: 14, fontWeight: 300, lineHeight: 1.7 }}>
            {isAbhay ? <InlineEdit value={stop.description || ''} inputType="textarea" onSave={saveField('description')} style={{ color: 'var(--ink-2)', fontSize: 14, fontWeight: 300, lineHeight: 1.7 }} /> : stop.description}
          </p>
          {(stop.alternative_name || isAbhay) && (
            <div style={{ marginTop: 16, color: 'var(--ink-2)', fontSize: 14 }}>
              Alternative:{' '}
              {isAbhay ? (
                <InlineEdit value={stop.alternative_name || ''} onSave={saveField('alternative_name')} placeholder="Alternative name" />
              ) : stop.alternative_maps_url ? (
                <a href={stop.alternative_maps_url} target="_blank" rel="noreferrer" style={{ color: 'var(--rust)', textDecoration: 'underline' }}>{stop.alternative_name}</a>
              ) : stop.alternative_name}
            </div>
          )}
          {stop.directions_url && (
            <div style={{ marginTop: 16 }}>
              <GhostButton label="Get Directions" onClick={() => window.open(stop.directions_url, '_blank', 'noopener,noreferrer')} />
            </div>
          )}
          {isAbhay && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18 }}>
              <GhostButton label="Delete stop" color="var(--nonveg)" onClick={() => setConfirmOpen(true)} />
            </div>
          )}
          <ConfirmSheet
            open={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            title="Delete this stop?"
            body="This removes the stop from the shared itinerary."
            confirmLabel="Delete stop"
            onConfirm={() => onDelete(stop.id)}
          />
        </div>
      )}
    </article>
  )
}

function AddStopSheet({ open, onClose, onSave }) {
  const [form, setForm] = useState({
    time: '',
    name: '',
    location: '',
    distance: '',
    entry_fee: 0,
    duration: '',
    description: '',
    photo_spot: '',
    abhay_note: '',
    alternative_name: '',
    alternative_maps_url: '',
    directions_url: '',
  })

  useEffect(() => {
    if (!open) return
    setForm({ time: '', name: '', location: '', distance: '', entry_fee: 0, duration: '', description: '', photo_spot: '', abhay_note: '', alternative_name: '', alternative_maps_url: '', directions_url: '' })
  }, [open])

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const canSave = form.name.trim() && form.time.trim()

  const handleSave = async () => {
    const ok = await onSave({
      ...form,
      entry_fee: Number(form.entry_fee) || 0,
      duration: form.duration || null,
      photo_spot: form.photo_spot || null,
      abhay_note: form.abhay_note || null,
      alternative_name: form.alternative_name || null,
      alternative_maps_url: form.alternative_maps_url || null,
      directions_url: form.directions_url || null,
    })
    if (ok) onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div style={{ padding: 24, display: 'grid', gap: 12 }}>
        <h2 className="display" style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>New Stop</h2>
        {[
          ['name', 'Stop name'],
          ['time', 'Time'],
          ['location', 'Location'],
          ['distance', 'Distance'],
          ['duration', 'Duration'],
          ['alternative_name', 'Alternative name'],
          ['alternative_maps_url', 'Alternative maps URL'],
          ['directions_url', 'Directions URL'],
        ].map(([field, label]) => (
          <input key={field} className="sheet-field" value={form[field]} placeholder={label} onChange={(e) => setField(field, e.target.value)} />
        ))}
        <input className="sheet-field mono" type="number" value={form.entry_fee} placeholder="Entry fee" onChange={(e) => setField('entry_fee', e.target.value)} />
        <textarea className="sheet-field" rows={3} value={form.description} placeholder="Description" onChange={(e) => setField('description', e.target.value)} />
        <PrimaryButton label="Add stop" onClick={handleSave} disabled={!canSave} />
      </div>
    </BottomSheet>
  )
}

function FoodScreen({ activeUser, onSwitch }) {
  const write = useWrite()
  const [filter, setFilter] = useState('all')
  const [restaurants, setRestaurants] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [error, setError] = useState('')
  const [addOpen, setAddOpen] = useState(false)

  const isAbhay = activeUser.name === 'Abhay'
  const isKashi = activeUser.name === 'Kashi'

  const fetchData = async () => {
    const [restaurantsResult, menuResult] = await Promise.all([
      supabase.from('restaurants').select('*').order('sort_order'),
      supabase.from('menu_items').select('*').order('sort_order'),
    ])
    if (restaurantsResult.error || menuResult.error) {
      setError('food')
      return
    }
    setRestaurants(restaurantsResult.data || [])
    setMenuItems(menuResult.data || [])
    setError('')
  }

  useEffect(() => {
    fetchData()
    const channel = supabase
      .channel('food-screen')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurants' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, fetchData)
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const updateRestaurant = (id, patch) => write(supabase.from('restaurants').update(patch).eq('id', id))
  const deleteRestaurant = (id) => write(supabase.from('restaurants').delete().eq('id', id))
  const updateMenuItem = (id, patch) => write(supabase.from('menu_items').update(patch).eq('id', id))
  const deleteMenuItem = (id) => write(supabase.from('menu_items').delete().eq('id', id))
  const addMenuItem = (restaurant, item) => write(supabase.from('menu_items').insert({
    restaurant_id: restaurant.id,
    sort_order: menuItems.filter((menuItem) => menuItem.restaurant_id === restaurant.id).length + 1,
    ...item,
  }))
  const addRestaurant = async (payload) => {
    const ok = await write(supabase.from('restaurants').upsert({
      id: makeId('rest'),
      sort_order: Math.max(0, ...restaurants.map((restaurant) => restaurant.sort_order || 0)) + 1,
      ...payload,
    }, { onConflict: 'id' }))
    if (ok) setAddOpen(false)
    return ok
  }

  const visibleRestaurants = restaurants
    .filter((restaurant) => filter === 'all' || restaurant.day === Number(filter))
    .filter((restaurant) => {
      if (!isKashi) return true
      return menuItems.some((item) => item.restaurant_id === restaurant.id && item.diet === 'veg')
    })

  return (
    <main className="screen">
      <TopBar activeUser={activeUser} onSwitch={onSwitch} />
      <header style={{ marginBottom: 24 }}>
        <h1 className="display" style={{ margin: '0 0 16px', fontSize: 32, fontWeight: 600 }}>Food Guide</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <PillTab label="All" active={filter === 'all'} onClick={() => setFilter('all')} />
          <PillTab label="Day 1" active={filter === '1'} onClick={() => setFilter('1')} />
          <PillTab label="Day 2" active={filter === '2'} onClick={() => setFilter('2')} />
        </div>
      </header>
      {error && <QuietError label="food guide" />}
      <div style={{ display: 'grid', gap: 12 }}>
        {visibleRestaurants.length ? visibleRestaurants.map((restaurant) => (
          <RestaurantCard
            key={restaurant.id}
            restaurant={restaurant}
            items={menuItems.filter((item) => item.restaurant_id === restaurant.id)}
            isAbhay={isAbhay}
            isKashi={isKashi}
            onUpdateRestaurant={updateRestaurant}
            onDeleteRestaurant={deleteRestaurant}
            onUpdateMenuItem={updateMenuItem}
            onDeleteMenuItem={deleteMenuItem}
            onAddMenuItem={addMenuItem}
          />
        )) : <EmptyState />}
        {isAbhay && (
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            style={{
              border: '0.5px dashed var(--line-strong)',
              borderRadius: 12,
              background: 'transparent',
              color: 'var(--ink-3)',
              padding: 20,
              fontSize: 14,
              fontWeight: 400,
            }}
          >
            + Add restaurant
          </button>
        )}
      </div>
      <AddRestaurantSheet open={addOpen} onClose={() => setAddOpen(false)} onSave={addRestaurant} />
    </main>
  )
}

function RestaurantCard({ restaurant, items, isAbhay, isKashi, onUpdateRestaurant, onDeleteRestaurant, onUpdateMenuItem, onDeleteMenuItem, onAddMenuItem }) {
  const [expanded, setExpanded] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const visibleItems = isKashi ? items.filter((item) => item.diet === 'veg') : items
  const saveRestaurant = (field, transform = (value) => value) => (value) => onUpdateRestaurant(restaurant.id, { [field]: transform(value) })

  return (
    <article className="card" style={{ padding: 20 }} onClick={() => setExpanded((value) => !value)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }}>
        <h2 className="display" style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>
          {isAbhay ? <InlineEdit value={restaurant.name} onSave={saveRestaurant('name')} style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }} /> : restaurant.name}
        </h2>
        {isKashi && <span style={{ background: 'color-mix(in srgb, var(--veg) 10%, transparent)', color: 'var(--veg)', fontSize: 11, fontWeight: 400, borderRadius: 999, padding: '3px 9px', whiteSpace: 'nowrap' }}>Veg-friendly</span>}
      </div>
      <div style={{ marginTop: 8, color: 'var(--ink-2)', fontSize: 13, fontWeight: 300 }}>
        {isAbhay ? <InlineEdit value={restaurant.meal_type || ''} onSave={saveRestaurant('meal_type')} placeholder="Meal type" /> : restaurant.meal_type}
        <span> · </span>
        Day {isAbhay ? <InlineEdit value={restaurant.day || ''} inputType="number" onSave={saveRestaurant('day', (value) => Number(value) || 1)} /> : restaurant.day}
        <span> · </span>
        {isAbhay ? <InlineEdit value={restaurant.time || ''} onSave={saveRestaurant('time')} placeholder="Time" /> : restaurant.time}
      </div>
      <div style={{ marginTop: 4, color: 'var(--ink-2)', fontSize: 13, fontWeight: 300 }}>
        {isAbhay ? <InlineEdit value={restaurant.address || ''} onSave={saveRestaurant('address')} placeholder="Address" /> : restaurant.address}
        {restaurant.distance && <span> · </span>}
        <span className="mono" style={{ color: 'var(--ink-3)', fontSize: 12 }}>
          {isAbhay ? <InlineEdit value={restaurant.distance || ''} onSave={saveRestaurant('distance')} placeholder="Distance" style={{ fontFamily: '"DM Mono", monospace', color: 'var(--ink-3)', fontSize: 12 }} /> : restaurant.distance}
        </span>
      </div>
      {expanded && (
        <div onClick={(e) => e.stopPropagation()} style={{ marginTop: 18, paddingTop: 16, borderTop: '0.5px solid var(--line)', display: 'grid', gap: 12 }}>
          {visibleItems.map((item) => (
            <MenuItemRow
              key={item.id}
              item={item}
              isAbhay={isAbhay}
              isKashi={isKashi}
              onUpdate={onUpdateMenuItem}
              onDelete={onDeleteMenuItem}
            />
          ))}
          {restaurant.has_cash_only_note && <div style={{ color: 'var(--amber)', fontSize: 13, fontWeight: 300 }}>Cash only - carry small notes</div>}
          {isAbhay && <AddMenuItemRow onSave={(item) => onAddMenuItem(restaurant, item)} />}
          {isAbhay && <GhostButton label="Delete restaurant" color="var(--nonveg)" onClick={() => setConfirmOpen(true)} style={{ justifySelf: 'start', marginTop: 4 }} />}
          <ConfirmSheet
            open={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            title="Delete restaurant?"
            body="This removes the restaurant and all of its menu items."
            confirmLabel="Delete restaurant"
            onConfirm={() => onDeleteRestaurant(restaurant.id)}
          />
        </div>
      )}
    </article>
  )
}

function MenuItemRow({ item, isAbhay, isKashi, onUpdate, onDelete }) {
  const saveItem = (field, transform = (value) => value) => (value) => onUpdate(item.id, { [field]: transform(value) })

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '8px 1fr auto', gap: 10, alignItems: 'start' }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.diet === 'veg' ? 'var(--veg)' : 'var(--nonveg)', marginTop: 7 }} />
      <div>
        <div style={{ color: 'var(--ink)', fontSize: 14, fontWeight: 400 }}>
          {isAbhay ? <InlineEdit value={item.name} onSave={saveItem('name')} /> : item.name}
        </div>
        {!isKashi && item.diet === 'veg' && <div style={{ color: 'var(--veg)', fontSize: 12, fontWeight: 300, marginTop: 2 }}>Kashi can have this</div>}
        {isAbhay && (
          <div style={{ marginTop: 8 }}>
            <DietToggle value={item.diet} onChange={(diet) => onUpdate(item.id, { diet })} />
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'start', gap: 8 }}>
        <span className="mono" style={{ color: 'var(--ink-2)', fontSize: 13, textAlign: 'right' }}>
          {isAbhay ? <InlineEdit value={item.price} inputType="number" onSave={saveItem('price', (value) => Number(value) || 0)} style={{ fontFamily: '"DM Mono", monospace', color: 'var(--ink-2)', fontSize: 13, textAlign: 'right' }} /> : formatMoney(item.price)}
        </span>
        {isAbhay && <button type="button" className="icon-button" aria-label="Delete item" onClick={() => onDelete(item.id)}><X size={15} color="var(--nonveg)" /></button>}
      </div>
    </div>
  )
}

function DietToggle({ value, onChange }) {
  return (
    <div style={{ display: 'inline-flex', gap: 6 }}>
      {['veg', 'non-veg'].map((diet) => (
        <button
          type="button"
          key={diet}
          onClick={() => onChange(diet)}
          style={{
            border: '0.5px solid var(--line)',
            borderRadius: 999,
            padding: '4px 10px',
            background: value === diet ? 'var(--ink)' : 'var(--surface)',
            color: value === diet ? 'var(--surface)' : 'var(--ink-2)',
            fontSize: 12,
          }}
        >
          {diet === 'veg' ? 'Veg' : 'Non-veg'}
        </button>
      ))}
    </div>
  )
}

function AddMenuItemRow({ onSave }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [diet, setDiet] = useState('veg')

  const save = async () => {
    if (!name.trim() || !price) return
    const ok = await onSave({ name: name.trim(), price: Number(price) || 0, diet })
    if (ok) {
      setName('')
      setPrice('')
      setDiet('veg')
      setOpen(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ border: '0.5px dashed var(--line-strong)', background: 'transparent', borderRadius: 8, padding: 12, color: 'var(--ink-3)', fontSize: 14, textAlign: 'left' }}
      >
        + Add item
      </button>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 8, border: '0.5px dashed var(--line-strong)', borderRadius: 8, padding: 12 }}>
      <input className="sheet-field" value={name} placeholder="Item name" onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && save()} />
      <input className="sheet-field mono" type="number" value={price} placeholder="Price" onChange={(e) => setPrice(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && save()} />
      <DietToggle value={diet} onChange={setDiet} />
      <PrimaryButton label="Add item" onClick={save} disabled={!name.trim() || !price} style={{ height: 44 }} />
    </div>
  )
}

function AddRestaurantSheet({ open, onClose, onSave }) {
  const [form, setForm] = useState({ name: '', meal_type: '', day: 1, time: '', address: '', distance: '', has_cash_only_note: false })

  useEffect(() => {
    if (open) setForm({ name: '', meal_type: '', day: 1, time: '', address: '', distance: '', has_cash_only_note: false })
  }, [open])

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div style={{ padding: 24, display: 'grid', gap: 12 }}>
        <h2 className="display" style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>New Restaurant</h2>
        <input className="sheet-field" value={form.name} placeholder="Name" onChange={(e) => setField('name', e.target.value)} />
        <input className="sheet-field" value={form.meal_type} placeholder="Meal type" onChange={(e) => setField('meal_type', e.target.value)} />
        <input className="sheet-field mono" type="number" value={form.day} placeholder="Day" onChange={(e) => setField('day', Number(e.target.value) || 1)} />
        <input className="sheet-field" value={form.time} placeholder="Time" onChange={(e) => setField('time', e.target.value)} />
        <input className="sheet-field" value={form.address} placeholder="Address" onChange={(e) => setField('address', e.target.value)} />
        <input className="sheet-field" value={form.distance} placeholder="Distance" onChange={(e) => setField('distance', e.target.value)} />
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 14, color: 'var(--ink-2)' }}>
          Cash only note
          <input type="checkbox" checked={form.has_cash_only_note} onChange={(e) => setField('has_cash_only_note', e.target.checked)} />
        </label>
        <PrimaryButton label="Add restaurant" onClick={() => onSave(form)} disabled={!form.name.trim()} />
      </div>
    </BottomSheet>
  )
}

function ExpensesScreen({ activeUser, onSwitch }) {
  const write = useWrite()
  const [expenses, setExpenses] = useState([])
  const [settlements, setSettlements] = useState([])
  const [error, setError] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [settleRow, setSettleRow] = useState(null)
  const [deleteExpense, setDeleteExpense] = useState(null)

  const fetchData = async () => {
    const [expensesResult, settlementsResult] = await Promise.all([
      supabase.from('expenses').select('*').order('created_at', { ascending: false }),
      supabase.from('settlements').select('*').order('settled_at', { ascending: false }),
    ])
    if (expensesResult.error || settlementsResult.error) {
      setError('expenses')
      return
    }
    setExpenses(expensesResult.data || [])
    setSettlements(settlementsResult.data || [])
    setError('')
  }

  useEffect(() => {
    fetchData()
    const channel = supabase
      .channel('expenses-screen')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settlements' }, fetchData)
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const balances = useMemo(() => computeBalances(expenses, settlements), [expenses, settlements])
  const totalSpent = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0)
  const youPaid = expenses.filter((expense) => expense.paid_by === activeUser.name).reduce((sum, expense) => sum + Number(expense.amount || 0), 0)
  const youOwe = balances.filter((row) => row.debtor === activeUser.name).reduce((sum, row) => sum + row.amount, 0)

  const addExpense = async (payload) => {
    const ok = await write(supabase.from('expenses').insert(payload))
    if (ok) setAddOpen(false)
    return ok
  }
  const settle = async (row) => {
    await write(supabase.from('settlements').insert({ from_user: row.debtor, to_user: row.creditor, amount: row.amount }), 'Settlement recorded.')
  }
  const removeExpense = async () => {
    if (!deleteExpense) return
    await write(supabase.from('expenses').delete().eq('id', deleteExpense.id))
    setDeleteExpense(null)
  }

  return (
    <main className="screen">
      <TopBar activeUser={activeUser} onSwitch={onSwitch} />
      <h1 className="display" style={{ margin: '0 0 24px', fontSize: 32, fontWeight: 600 }}>Expenses</h1>
      {error && <QuietError label="expenses" />}
      <section style={{ background: 'var(--rust)', color: 'var(--surface)', padding: 24, borderRadius: 12, marginBottom: 32 }}>
        <div style={{ color: 'rgba(255,255,255,0.70)', fontSize: 11, fontWeight: 400, letterSpacing: '0.10em' }}>TOTAL SPENT</div>
        <div className="mono" style={{ fontSize: 32, marginTop: 8 }}>{formatMoney(totalSpent)}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 22 }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.70)', fontSize: 12, fontWeight: 300 }}>You paid</div>
            <div className="mono" style={{ fontSize: 20 }}>{formatMoney(youPaid)}</div>
          </div>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.70)', fontSize: 12, fontWeight: 300 }}>You owe</div>
            <div className="mono" style={{ fontSize: 20 }}>{formatMoney(youOwe)}</div>
          </div>
        </div>
      </section>
      <section style={{ marginBottom: 32 }}>
        <SectionLabel text="BALANCES" />
        <div style={{ display: 'grid', gap: 10 }}>
          {balances.length ? balances.map((row) => (
            <BalanceRow key={`${row.debtor}-${row.creditor}`} row={row} activeUser={activeUser} onSettle={() => setSettleRow(row)} />
          )) : <EmptyState />}
          {settlements.slice(0, 3).map((row) => (
            <div key={row.id} className="card" style={{ padding: 14, color: 'var(--ink-3)', textDecoration: 'line-through', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontSize: 13 }}>{row.from_user} paid {row.to_user} <span className="mono">{formatMoney(row.amount)}</span></span>
              <PillTag label="Settled" color="var(--ink-3)" />
            </div>
          ))}
        </div>
      </section>
      <section>
        <SectionLabel text="ALL EXPENSES" />
        <div style={{ display: 'grid', gap: 12 }}>
          {expenses.length ? expenses.map((expense) => (
            <ExpenseCard key={expense.id} expense={expense} activeUser={activeUser} onDelete={() => setDeleteExpense(expense)} />
          )) : <EmptyState />}
        </div>
      </section>
      <button
        type="button"
        aria-label="Add expense"
        onClick={() => setAddOpen(true)}
        style={{
          position: 'fixed',
          bottom: 88,
          right: 'max(20px, calc((100vw - 430px) / 2 + 20px))',
          width: 56,
          height: 56,
          borderRadius: '50%',
          border: 'none',
          background: 'var(--rust)',
          color: 'var(--surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 45,
        }}
      >
        <Plus size={22} />
      </button>
      <AddExpenseSheet open={addOpen} onClose={() => setAddOpen(false)} onSave={addExpense} activeUser={activeUser} />
      <SettleSheet open={Boolean(settleRow)} row={settleRow} onClose={() => setSettleRow(null)} onConfirm={settle} />
      <ConfirmSheet
        open={Boolean(deleteExpense)}
        onClose={() => setDeleteExpense(null)}
        title="Delete expense?"
        body="This removes the expense from the shared trip ledger."
        confirmLabel="Delete expense"
        onConfirm={removeExpense}
      />
    </main>
  )
}

function computeBalances(expenses, settlements) {
  const owes = {}

  expenses.forEach((expense) => {
    const splitWith = expense.split_with || []
    if (!splitWith.length) return
    const perPerson = Number(expense.amount || 0) / splitWith.length
    splitWith.forEach((debtor) => {
      if (debtor === expense.paid_by) return
      if (!owes[debtor]) owes[debtor] = {}
      owes[debtor][expense.paid_by] = (owes[debtor][expense.paid_by] || 0) + perPerson
    })
  })

  settlements.forEach((settlement) => {
    if (!owes[settlement.from_user]) owes[settlement.from_user] = {}
    owes[settlement.from_user][settlement.to_user] = (owes[settlement.from_user][settlement.to_user] || 0) - Number(settlement.amount || 0)
  })

  const results = []
  const processed = new Set()
  Object.keys(owes).forEach((a) => {
    Object.keys(owes[a] || {}).forEach((b) => {
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

function BalanceRow({ row, activeUser, onSettle }) {
  const debtorIsActive = row.debtor === activeUser.name
  const creditorIsActive = row.creditor === activeUser.name

  return (
    <div
      className="card"
      style={{
        padding: 14,
        borderLeft: debtorIsActive ? '3px solid var(--nonveg)' : creditorIsActive ? '3px solid var(--veg)' : '0.5px solid var(--line)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div style={{ color: debtorIsActive || creditorIsActive ? 'var(--ink)' : 'var(--ink-3)', fontSize: debtorIsActive || creditorIsActive ? 14 : 13, fontWeight: debtorIsActive || creditorIsActive ? 400 : 300 }}>
        {debtorIsActive ? `You owe ${row.creditor}` : creditorIsActive ? `${row.debtor} owes you` : `${row.debtor} owes ${row.creditor}`}{' '}
        <span className="mono">{formatMoney(row.amount)}</span>
      </div>
      {debtorIsActive && <GhostButton label="Settle" onClick={onSettle} />}
    </div>
  )
}

function ExpenseCard({ expense, activeUser, onDelete }) {
  const date = expense.created_at ? new Date(expense.created_at) : null
  const timestamp = date ? date.toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''

  return (
    <article className="card" style={{ padding: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
        <div>
          <h3 style={{ margin: 0, color: 'var(--ink)', fontSize: 15, fontWeight: 500 }}>{expense.description}</h3>
          <p style={{ margin: '6px 0 0', color: 'var(--ink-2)', fontSize: 13, fontWeight: 300 }}>
            Paid by {expense.paid_by} · Split: {(expense.split_with || []).join(', ')}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="mono" style={{ color: 'var(--ink)', fontSize: 16 }}>{formatMoney(expense.amount)}</div>
          <div className="mono" style={{ color: 'var(--ink-3)', fontSize: 11, marginTop: 4 }}>{timestamp}</div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
        <span style={{ background: 'var(--surface-2)', color: 'var(--ink-2)', borderRadius: 999, padding: '3px 10px', fontSize: 12, fontWeight: 400 }}>{expense.category}</span>
        {expense.paid_by === activeUser.name && <GhostButton label="Delete" color="var(--nonveg)" onClick={onDelete} style={{ fontSize: 12, fontWeight: 400 }} />}
      </div>
    </article>
  )
}

function AddExpenseSheet({ open, onClose, onSave, activeUser }) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [paidBy, setPaidBy] = useState(activeUser.name)
  const [splitWith, setSplitWith] = useState(USERS.map((user) => user.name))
  const [category, setCategory] = useState('Food')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    setDescription('')
    setAmount('')
    setPaidBy(activeUser.name)
    setSplitWith(USERS.map((user) => user.name))
    setCategory('Food')
    setDropdownOpen(false)
  }, [open, activeUser.name])

  const toggleSplit = (name) => {
    setSplitWith((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name])
  }

  const handleSave = () => onSave({
    description: description.trim(),
    amount: Number(amount) || 0,
    paid_by: paidBy,
    split_with: splitWith,
    category,
  })

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div style={{ padding: 24, paddingBottom: 'calc(24px + env(safe-area-inset-bottom))', display: 'grid', gap: 16 }}>
        <h2 className="display" style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>New Expense</h2>
        <input className="sheet-field" value={description} placeholder="What was this for?" onChange={(e) => setDescription(e.target.value)} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '0.5px solid var(--line)', borderRadius: 8, background: 'var(--surface)', padding: '0 12px' }}>
          <span className="mono" style={{ color: 'var(--ink-2)', fontSize: 14 }}>Rs.</span>
          <input
            value={amount}
            type="number"
            placeholder="0"
            onChange={(e) => setAmount(e.target.value)}
            className="mono"
            style={{ border: 'none', outline: 'none', background: 'transparent', height: 44, flex: 1, color: 'var(--ink)' }}
          />
        </div>
        <div>
          <div style={{ color: 'var(--ink-3)', fontSize: 11, letterSpacing: '0.10em', marginBottom: 8 }}>PAID BY</div>
          <button
            type="button"
            onClick={() => setDropdownOpen((value) => !value)}
            className="sheet-field"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar user={getUser(paidBy)} size={32} />
              {paidBy}
            </span>
            <ChevronDown size={16} color="var(--ink-3)" />
          </button>
          {dropdownOpen && (
            <div className="card" style={{ marginTop: 8, overflow: 'hidden' }}>
              {USERS.map((user) => (
                <button
                  type="button"
                  key={user.name}
                  onClick={() => {
                    setPaidBy(user.name)
                    setDropdownOpen(false)
                  }}
                  style={{ width: '100%', border: 'none', background: 'transparent', padding: 12, display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', color: 'var(--ink)' }}
                >
                  <Avatar user={user} size={32} />
                  {user.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <div style={{ color: 'var(--ink-3)', fontSize: 11, letterSpacing: '0.10em', marginBottom: 8 }}>SPLIT WITH</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {USERS.map((user) => {
              const checked = splitWith.includes(user.name)
              return (
                <button
                  type="button"
                  key={user.name}
                  onClick={() => toggleSplit(user.name)}
                  className="card"
                  style={{ padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: checked ? 'var(--surface)' : 'var(--surface-2)' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar user={user} size={32} />
                    {user.name}
                  </span>
                  <span style={{ width: 38, height: 22, borderRadius: 999, background: checked ? 'var(--rust)' : 'var(--line-strong)', position: 'relative' }}>
                    <span style={{ position: 'absolute', top: 3, left: checked ? 19 : 3, width: 16, height: 16, borderRadius: '50%', background: 'var(--surface)', transition: 'left 260ms cubic-bezier(0.16, 1, 0.3, 1)' }} />
                  </span>
                </button>
              )
            })}
          </div>
        </div>
        <div className="scroll-row" style={{ display: 'flex', gap: 8 }}>
          {CATEGORIES.map((item) => (
            <PillTab key={item} label={item} active={category === item} onClick={() => setCategory(item)} />
          ))}
        </div>
        <GhostButton label="Discard" onClick={onClose} color="var(--ink-3)" style={{ justifySelf: 'center', padding: 8 }} />
        <PrimaryButton label="Add Expense" onClick={handleSave} disabled={!description.trim() || !amount || !splitWith.length} />
      </div>
    </BottomSheet>
  )
}

function SettleSheet({ open, row, onClose, onConfirm }) {
  if (!row) return null

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div style={{ padding: 24, display: 'grid', gap: 14 }}>
        <h2 className="display" style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Mark as settled?</h2>
        <p style={{ margin: 0, color: 'var(--ink-2)', fontSize: 14, fontWeight: 400 }}>You owe {row.creditor} <span className="mono">{formatMoney(row.amount)}</span></p>
        <p style={{ margin: 0, color: 'var(--ink-3)', fontSize: 13, fontWeight: 300 }}>This records the settlement and clears the debt.</p>
        <PrimaryButton label="Confirm settlement" onClick={async () => { await onConfirm(row); onClose() }} />
        <GhostButton label="Cancel" onClick={onClose} color="var(--ink-3)" style={{ justifySelf: 'center', padding: 8 }} />
      </div>
    </BottomSheet>
  )
}

function MoreScreen({ activeUser, onSwitch }) {
  const write = useWrite()
  const [definitions, setDefinitions] = useState([])
  const [items, setItems] = useState([])
  const [tips, setTips] = useState([])
  const [contacts, setContacts] = useState([])
  const [error, setError] = useState('')
  const [newCategoryOpen, setNewCategoryOpen] = useState(false)

  const isAbhay = activeUser.name === 'Abhay'

  const fetchData = async () => {
    const [itemsResult, definitionsResult, tipsResult, contactsResult] = await Promise.all([
      supabase.from('checklist_items').select('*').eq('user_name', activeUser.name),
      supabase.from('checklist_definitions').select('*').order('sort_order'),
      supabase.from('trip_tips').select('*').order('sort_order'),
      supabase.from('emergency_contacts').select('*').order('sort_order'),
    ])
    if (itemsResult.error || definitionsResult.error || tipsResult.error || contactsResult.error) {
      setError('more')
      return
    }
    setItems(itemsResult.data || [])
    setDefinitions(definitionsResult.data || [])
    setTips(tipsResult.data || [])
    setContacts(contactsResult.data || [])
    setError('')
  }

  useEffect(() => {
    fetchData()
    const channel = supabase
      .channel('more-screen')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checklist_items' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checklist_definitions' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_tips' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emergency_contacts' }, fetchData)
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const stateMap = useMemo(() => Object.fromEntries(items.map((item) => [item.item_id, item.checked])), [items])
  const checkedCount = definitions.filter((item) => stateMap[item.id]).length
  const progress = definitions.length ? (checkedCount / definitions.length) * 100 : 0
  const groups = useMemo(() => definitions.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {}), [definitions])

  const toggleChecklist = (definition) => write(supabase.from('checklist_items').upsert({
    user_name: activeUser.name,
    item_id: definition.id,
    checked: !stateMap[definition.id],
  }, { onConflict: 'user_name,item_id' }))
  const updateDefinition = (id, patch) => write(supabase.from('checklist_definitions').update(patch).eq('id', id))
  const updateCategory = (oldCategory, nextCategory) => write(supabase.from('checklist_definitions').update({ category: nextCategory }).eq('category', oldCategory))
  const deleteDefinition = (id) => write(supabase.from('checklist_definitions').delete().eq('id', id))
  const addChecklistItem = (category, label) => write(supabase.from('checklist_definitions').upsert({
    id: makeId('cl'),
    category,
    label,
    sort_order: Math.max(0, ...definitions.map((item) => item.sort_order || 0)) + 1,
  }, { onConflict: 'id' }))
  const addCategory = async (category) => {
    const ok = await addChecklistItem(category, 'New item')
    if (ok) setNewCategoryOpen(false)
  }
  const updateTip = (id, patch) => write(supabase.from('trip_tips').update(patch).eq('id', id))
  const deleteTip = (id) => write(supabase.from('trip_tips').delete().eq('id', id))
  const addTip = (content) => write(supabase.from('trip_tips').insert({ content, sort_order: tips.length + 1 }))
  const updateContact = (id, patch) => write(supabase.from('emergency_contacts').update(patch).eq('id', id))
  const deleteContact = (id) => write(supabase.from('emergency_contacts').delete().eq('id', id))
  const addContact = (label) => write(supabase.from('emergency_contacts').insert({ label, number: '000', sort_order: contacts.length + 1 }))

  return (
    <main className="screen">
      <TopBar activeUser={activeUser} onSwitch={onSwitch} />
      {error && <QuietError label="more details" />}
      <section style={{ display: 'grid', gap: 32 }}>
        <section>
          <h1 className="display" style={{ margin: 0, fontSize: 26, fontWeight: 600 }}>Packing List</h1>
          <div style={{ marginTop: 10, color: 'var(--ink-2)', fontSize: 13, fontWeight: 400 }}>{checkedCount} of {definitions.length} packed</div>
          <div style={{ height: 4, background: 'var(--line)', borderRadius: 999, margin: '10px 0 24px', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'var(--rust)', borderRadius: 999 }} />
          </div>
          <div style={{ display: 'grid', gap: 22 }}>
            {Object.entries(groups).map(([category, groupItems]) => (
              <div key={category}>
                <div style={{ marginBottom: 12, color: 'var(--ink-3)', fontSize: 11, fontWeight: 400, letterSpacing: '0.10em', textTransform: 'uppercase' }}>
                  {isAbhay ? (
                    <InlineEdit value={category} onSave={(value) => updateCategory(category, value)} style={{ color: 'var(--ink-3)', fontSize: 11, fontWeight: 400, letterSpacing: '0.10em', textTransform: 'uppercase' }} />
                  ) : category}
                </div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {groupItems.map((definition) => (
                    <ChecklistRow
                      key={definition.id}
                      definition={definition}
                      checked={Boolean(stateMap[definition.id])}
                      isAbhay={isAbhay}
                      onToggle={() => toggleChecklist(definition)}
                      onUpdate={(value) => updateDefinition(definition.id, { label: value })}
                      onDelete={() => deleteDefinition(definition.id)}
                    />
                  ))}
                  {isAbhay && <InlineAdd label="+ Add item" onSave={(label) => addChecklistItem(category, label)} />}
                </div>
              </div>
            ))}
            {isAbhay && (newCategoryOpen ? (
              <InlineAdd label="Category name" autoOpen onSave={addCategory} />
            ) : (
              <button type="button" onClick={() => setNewCategoryOpen(true)} style={{ border: 'none', background: 'transparent', color: 'var(--ink-3)', fontSize: 14, textAlign: 'left', padding: 0 }}>+ Add category</button>
            ))}
          </div>
        </section>
        <section>
          <h2 className="display" style={{ margin: '0 0 18px', fontSize: 26, fontWeight: 600 }}>{isAbhay ? 'Trip Tips' : 'Tips from Abhay'}</h2>
          <div style={{ display: 'grid', gap: 14 }}>
            {tips.length ? tips.map((tip, index) => (
              <div key={tip.id} style={{ display: 'grid', gridTemplateColumns: '24px 1fr auto', gap: 10, alignItems: 'start' }}>
                <span className="mono" style={{ color: 'var(--rust)', fontSize: 14 }}>{index + 1}</span>
                <div style={{ color: 'var(--ink)', fontSize: 14, fontWeight: 400, lineHeight: 1.7 }}>
                  {isAbhay ? <InlineEdit value={tip.content} inputType="textarea" onSave={(value) => updateTip(tip.id, { content: value })} style={{ color: 'var(--ink)', fontSize: 14, lineHeight: 1.7 }} /> : tip.content}
                </div>
                {isAbhay && <button type="button" className="icon-button" onClick={() => deleteTip(tip.id)} aria-label="Delete tip"><X size={15} color="var(--nonveg)" /></button>}
              </div>
            )) : <EmptyState />}
            {isAbhay && <InlineAdd label="+ Add tip" onSave={addTip} textarea />}
          </div>
        </section>
        <section>
          <h2 className="display" style={{ margin: '0 0 18px', fontSize: 26, fontWeight: 600 }}>Emergency</h2>
          <div style={{ display: 'grid', gap: 12 }}>
            {contacts.map((contact) => (
              <ContactRow key={contact.id} contact={contact} isAbhay={isAbhay} onUpdate={updateContact} onDelete={deleteContact} />
            ))}
            {isAbhay && <InlineAdd label="+ Add contact" onSave={addContact} />}
          </div>
          <p style={{ margin: '16px 0 0', color: 'var(--ink-3)', fontSize: 12, fontWeight: 300 }}>Nearest hospital to Charminar: Osmania General Hospital, Afzalgunj</p>
        </section>
      </section>
    </main>
  )
}

function ChecklistRow({ definition, checked, isAbhay, onToggle, onUpdate, onDelete }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '20px 1fr auto', gap: 12, alignItems: 'center' }}>
      <button
        type="button"
        onClick={onToggle}
        aria-label="Toggle checklist item"
        style={{
          width: 20,
          height: 20,
          borderRadius: 4,
          border: checked ? 'none' : '1.5px solid var(--line-strong)',
          background: checked ? 'var(--rust)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {checked && <Check size={12} color="var(--surface)" />}
      </button>
      <div style={{ color: checked ? 'var(--ink-3)' : 'var(--ink)', textDecoration: checked ? 'line-through' : 'none', fontSize: 14, fontWeight: 400 }}>
        {isAbhay ? <InlineEdit value={definition.label} onSave={onUpdate} style={{ color: checked ? 'var(--ink-3)' : 'var(--ink)', textDecoration: checked ? 'line-through' : 'none', fontSize: 14, fontWeight: 400 }} /> : definition.label}
      </div>
      {isAbhay && <button type="button" className="icon-button" onClick={onDelete} aria-label="Delete checklist item"><X size={15} color="var(--nonveg)" /></button>}
    </div>
  )
}

function InlineAdd({ label, onSave, textarea = false, autoOpen = false }) {
  const [open, setOpen] = useState(autoOpen)
  const [value, setValue] = useState('')

  const save = async () => {
    if (!value.trim()) return
    const ok = await onSave(value.trim())
    if (ok !== false) {
      setValue('')
      setOpen(false)
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} style={{ border: 'none', background: 'transparent', color: 'var(--ink-3)', fontSize: 14, textAlign: 'left', padding: 0 }}>
        {label}
      </button>
    )
  }

  const commonProps = {
    className: 'sheet-field',
    value,
    placeholder: label,
    onChange: (e) => setValue(e.target.value),
    onBlur: save,
    onKeyDown: (e) => {
      if (e.key === 'Enter' && !textarea) save()
      if (e.key === 'Escape') {
        setValue('')
        setOpen(false)
      }
    },
  }

  return textarea ? <textarea rows={2} {...commonProps} /> : <input {...commonProps} autoFocus />
}

function ContactRow({ contact, isAbhay, onUpdate, onDelete }) {
  if (isAbhay) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, alignItems: 'center' }}>
        <div style={{ color: 'var(--ink-2)', fontSize: 14, fontWeight: 400 }}>
          <InlineEdit value={contact.label} onSave={(value) => onUpdate(contact.id, { label: value })} />
        </div>
        <div className="mono" style={{ color: 'var(--ink)', fontSize: 14, textAlign: 'right' }}>
          <InlineEdit value={contact.number} onSave={(value) => onUpdate(contact.id, { number: value })} style={{ fontFamily: '"DM Mono", monospace', fontSize: 14, color: 'var(--ink)', textAlign: 'right' }} />
        </div>
        <button type="button" className="icon-button" onClick={() => onDelete(contact.id)} aria-label="Delete contact"><X size={15} color="var(--nonveg)" /></button>
      </div>
    )
  }

  return (
    <a href={`tel:${contact.number}`} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, textDecoration: 'none' }}>
      <span style={{ color: 'var(--ink-2)', fontSize: 14, fontWeight: 400 }}>{contact.label}</span>
      <span className="mono" style={{ color: 'var(--ink)', fontSize: 14, textAlign: 'right' }}>{contact.number}</span>
    </a>
  )
}
