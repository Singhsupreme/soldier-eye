import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { SectionHeader, Toast } from '../components/UI'
import AppLayout from '../components/AppLayout'
import { CheckCircle, Circle, MapPin, AlertTriangle } from 'lucide-react'

const DEMO_CHECKPOINTS = [
  { id: 'cp1', name: 'Gate A – Main Entrance', zone: 'Entry Points', priority: 'high', order_index: 1 },
  { id: 'cp2', name: 'Lobby – Ground Floor', zone: 'Interior', priority: 'high', order_index: 2 },
  { id: 'cp3', name: 'Stairwell A – All Floors', zone: 'Interior', priority: 'medium', order_index: 3 },
  { id: 'cp4', name: 'Parking Level 1', zone: 'Exterior', priority: 'medium', order_index: 4 },
  { id: 'cp5', name: 'Parking Level 2', zone: 'Exterior', priority: 'medium', order_index: 5 },
  { id: 'cp6', name: 'Rooftop Access', zone: 'Secured Zones', priority: 'low', order_index: 6 },
  { id: 'cp7', name: 'Server Room – B1', zone: 'Secured Zones', priority: 'high', order_index: 7 },
  { id: 'cp8', name: 'Loading Dock', zone: 'Exterior', priority: 'medium', order_index: 8 },
]

const PRIORITY_COLORS = {
  high: 'text-danger bg-danger/10',
  medium: 'text-accent bg-accent/10',
  low: 'text-gray-400 bg-surface3',
}

export default function PatrolPage() {
  const { user, profile } = useAuth()
  const [checkpoints, setCheckpoints] = useState(DEMO_CHECKPOINTS)
  const [checked, setChecked] = useState({})
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' })
  const shiftDate = new Date().toISOString().split('T')[0]

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    // Try to load from Supabase; fall back to demo
    try {
      const [{ data: cps }, { data: logs }] = await Promise.all([
        supabase.from('patrol_checkpoints').select('*').order('order_index'),
        supabase.from('patrol_logs').select('checkpoint_id').eq('guard_id', user?.id).eq('shift_date', shiftDate)
      ])
      if (cps?.length) setCheckpoints(cps)
      if (logs?.length) {
        const map = {}
        logs.forEach(l => { map[l.checkpoint_id] = true })
        setChecked(map)
      }
    } catch {
      // demo mode - pre-check first 5
      const demo = {}
      DEMO_CHECKPOINTS.slice(0, 5).forEach(c => { demo[c.id] = true })
      setChecked(demo)
    }
    setLoading(false)
  }

  async function toggleCheckpoint(cp) {
    const isChecked = checked[cp.id]
    const newChecked = { ...checked, [cp.id]: !isChecked }
    setChecked(newChecked)

    if (!isChecked) {
      // Insert patrol log
      try {
        await supabase.from('patrol_logs').insert({
          checkpoint_id: cp.id,
          guard_id: user?.id,
          guard_name: profile?.full_name || 'Officer',
          shift_date: shiftDate,
          checked_at: new Date().toISOString()
        })
        setToast({ visible: true, message: `${cp.name} checked ✓`, type: 'success' })
        setTimeout(() => setToast(t => ({ ...t, visible: false })), 2500)
      } catch {
        // demo mode - just show toast
        setToast({ visible: true, message: `${cp.name} checked (demo)`, type: 'success' })
        setTimeout(() => setToast(t => ({ ...t, visible: false })), 2500)
      }
    } else {
      // Remove log
      try {
        await supabase.from('patrol_logs').delete().eq('checkpoint_id', cp.id).eq('guard_id', user?.id).eq('shift_date', shiftDate)
      } catch {}
    }
  }

  const checkedCount = Object.values(checked).filter(Boolean).length
  const total = checkpoints.length
  const pct = total ? Math.round((checkedCount / total) * 100) : 0

  const grouped = checkpoints.reduce((acc, cp) => {
    const zone = cp.zone || 'General'
    if (!acc[zone]) acc[zone] = []
    acc[zone].push(cp)
    return acc
  }, {})

  return (
    <AppLayout>
      <Toast {...toast}/>

      {/* Header */}
      <div className="bg-surface border-b border-border px-4 pt-4 pb-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-syne font-bold text-lg text-white">Patrol Checklist</h2>
          <div className="text-sm font-syne font-bold text-accent">{checkedCount} / {total}</div>
        </div>

        {/* Progress bar */}
        <div className="bg-surface3 rounded-full h-2 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: pct === 100 ? '#1D9E75' : '#E8B84B' }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-xs text-gray-500">{pct}% complete</span>
          {pct < 100 && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <AlertTriangle size={11} className="text-warn"/> {total - checkedCount} remaining
            </span>
          )}
          {pct === 100 && <span className="text-xs text-success font-medium">All checks done ✓</span>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scroll-content pb-4">
        {/* Location indicator */}
        <div className="mx-4 mt-4 mb-2 bg-surface2 border border-border rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="pulse-dot"/>
          <div>
            <div className="text-sm font-medium text-white">{profile?.post || 'North Tower Complex'}</div>
            <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <MapPin size={10}/> Live tracking active
            </div>
          </div>
          <div className="ml-auto text-xs text-gray-500">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* Checkpoint groups */}
        {Object.entries(grouped).map(([zone, cps]) => (
          <div key={zone}>
            <SectionHeader>{zone}</SectionHeader>
            <div className="px-4 space-y-2">
              {cps.map(cp => {
                const done = checked[cp.id]
                return (
                  <button
                    key={cp.id}
                    onClick={() => toggleCheckpoint(cp)}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                      done ? 'bg-success/5 border-success/25' : 'bg-surface2 border-border'
                    }`}
                  >
                    {done
                      ? <CheckCircle size={22} className="text-success flex-shrink-0"/>
                      : <Circle size={22} className="text-gray-600 flex-shrink-0"/>
                    }
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${done ? 'text-gray-400 line-through' : 'text-white'}`}>
                        {cp.name}
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize flex-shrink-0 ${PRIORITY_COLORS[cp.priority]}`}>
                      {cp.priority}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  )
}