import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { SevPill, StatusPill, SectionHeader, EmptyState, Skeleton } from '../components/UI'
import AppLayout from '../components/AppLayout'
import { MapPin, Clock, ChevronDown, Filter } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const DEMO = [
  { id: '1', type: 'Unauthorized Access', severity: 'critical', status: 'open', location: 'Gate B', zone: 'Parking Level 2', guard_name: 'R. Singh', created_at: new Date(Date.now()-8*60000).toISOString() },
  { id: '2', type: 'Suspicious Person', severity: 'high', status: 'in_progress', location: 'Lobby', zone: 'Main Entrance', guard_name: 'T. Williams', created_at: new Date(Date.now()-2.5*3600000).toISOString() },
  { id: '3', type: 'Equipment Malfunction', severity: 'medium', status: 'resolved', location: 'CCTV Room', zone: 'Floor 3', guard_name: 'R. Singh', created_at: new Date(Date.now()-18*3600000).toISOString() },
  { id: '4', type: 'Trespassing', severity: 'high', status: 'open', location: 'Perimeter', zone: 'North Fence', guard_name: 'A. Okonkwo', created_at: new Date(Date.now()-32*3600000).toISOString() },
  { id: '5', type: 'Medical Emergency', severity: 'critical', status: 'resolved', location: 'Lobby', zone: 'Ground Floor', guard_name: 'T. Williams', created_at: new Date(Date.now()-3*86400000).toISOString() },
]

export default function IncidentsPage() {
  const navigate = useNavigate()
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ status: '', severity: '' })
  const [showFilter, setShowFilter] = useState(false)

  useEffect(() => {
    fetchIncidents()
  }, [filter])

  async function fetchIncidents() {
    setLoading(true)
    let q = supabase.from('incidents').select('*').order('created_at', { ascending: false })
    if (filter.status) q = q.eq('status', filter.status)
    if (filter.severity) q = q.eq('severity', filter.severity)
    const { data } = await q.limit(50)
    setIncidents(data?.length ? data : DEMO.filter(i =>
      (!filter.status || i.status === filter.status) &&
      (!filter.severity || i.severity === filter.severity)
    ))
    setLoading(false)
  }

  return (
    <AppLayout>
      <div className="bg-surface border-b border-border px-4 pt-4 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="font-syne font-bold text-lg text-white">All Incidents</h2>
          <button onClick={() => setShowFilter(!showFilter)} className={`flex items-center gap-1.5 text-xs border rounded-lg px-3 py-1.5 transition-colors ${showFilter || filter.status || filter.severity ? 'border-accent/40 text-accent' : 'border-border text-gray-500'}`}>
            <Filter size={12}/> Filter
          </button>
        </div>
        {showFilter && (
          <div className="flex gap-2 mt-3">
            <select className="field-input text-xs py-2 flex-1" value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}>
              <option value="">All statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
            <select className="field-input text-xs py-2 flex-1" value={filter.severity} onChange={e => setFilter(f => ({ ...f, severity: e.target.value }))}>
              <option value="">All severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scroll-content pt-3 pb-4">
        {loading ? (
          <div className="px-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-2xl"/>)}</div>
        ) : incidents.length === 0 ? (
          <EmptyState icon="🔍" title="No incidents found" subtitle="Try adjusting your filters"/>
        ) : incidents.map(inc => (
          <div key={inc.id} onClick={() => navigate(`/incidents/${inc.id}`, { state: { incident: inc } })}
            className="glass-card mx-4 mb-3 p-4 cursor-pointer active:bg-surface3 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <span className="font-syne font-bold text-sm text-white">{inc.type}</span>
              <SevPill severity={inc.severity}/>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <MapPin size={10}/> {inc.location}{inc.zone ? ` · ${inc.zone}` : ''}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
              <Clock size={10}/> {inc.created_at ? formatDistanceToNow(new Date(inc.created_at), { addSuffix: true }) : ''}
            </div>
            <div className="flex items-center gap-2">
              <StatusPill status={inc.status}/>
              <span className="text-xs text-gray-600 ml-auto">{inc.guard_name}</span>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  )
}