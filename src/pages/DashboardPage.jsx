import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { SevPill, StatusPill, SectionHeader, Skeleton, EmptyState } from '../components/UI'
import AppLayout from '../components/AppLayout'
import { LogOut, Bell, MapPin, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

function StatCard({ value, label, badge, color }) {
  return (
    <div className="glass-card p-4">
      <div className={`font-syne font-bold text-3xl ${color || 'text-white'}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
      {badge && <div className="mt-2 text-[11px] font-medium text-gray-400 bg-surface3 rounded-full px-2 py-0.5 inline-block">{badge}</div>}
    </div>
  )
}

function IncidentCard({ incident, onClick }) {
  const ago = incident.created_at
    ? formatDistanceToNow(new Date(incident.created_at), { addSuffix: true })
    : ''
  return (
    <div onClick={onClick} className="glass-card mx-4 mb-3 p-4 cursor-pointer active:bg-surface3 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <span className="font-syne font-bold text-sm text-white">{incident.type}</span>
        <SevPill severity={incident.severity}/>
      </div>
      <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
        <MapPin size={11}/> {incident.location}{incident.zone ? ` · ${incident.zone}` : ''}
      </div>
      <div className="flex items-center gap-1 text-xs text-gray-500">
        <Clock size={11}/> {ago}
      </div>
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
        <StatusPill status={incident.status}/>
        {incident.guard_name && (
          <span className="text-xs text-gray-600 ml-auto">By: {incident.guard_name}</span>
        )}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ open: 0, inProgress: 0, today: 0, total: 0 })

  useEffect(() => {
    fetchIncidents()
    // Real-time subscription
    const channel = supabase
      .channel('incidents-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, () => {
        fetchIncidents()
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchIncidents() {
    const { data } = await supabase
      .from('incidents')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    if (data) {
      setIncidents(data)
      const today = new Date().toISOString().split('T')[0]
      setStats({
        open: data.filter(i => i.status === 'open').length,
        inProgress: data.filter(i => i.status === 'in_progress').length,
        today: data.filter(i => i.created_at?.startsWith(today)).length,
        total: data.length
      })
    }
    setLoading(false)
  }

  // Demo incidents when Supabase isn't connected
  const demoIncidents = [
    { id: '1', type: 'Unauthorized Access', severity: 'critical', status: 'open', location: 'Gate B', zone: 'Parking Level 2', guard_name: 'R. Singh', created_at: new Date(Date.now()-8*60000).toISOString() },
    { id: '2', type: 'Suspicious Person', severity: 'high', status: 'in_progress', location: 'Lobby', zone: 'Main Entrance', guard_name: 'T. Williams', created_at: new Date(Date.now()-2.5*3600000).toISOString() },
    { id: '3', type: 'Equipment Malfunction', severity: 'medium', status: 'resolved', location: 'CCTV Room', zone: 'Floor 3', guard_name: 'R. Singh', created_at: new Date(Date.now()-18*3600000).toISOString() },
    { id: '4', type: 'Trespassing', severity: 'high', status: 'open', location: 'Perimeter', zone: 'North Fence', guard_name: 'A. Okonkwo', created_at: new Date(Date.now()-32*3600000).toISOString() },
  ]
  const displayIncidents = incidents.length > 0 ? incidents : (loading ? [] : demoIncidents)
  const displayStats = incidents.length > 0 ? stats : { open: 3, inProgress: 1, today: 2, total: 27 }

  return (
    <AppLayout>
      {/* Header */}
      <div className="bg-surface flex-shrink-0 border-b border-border">
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div>
            <h1 className="font-syne font-bold text-xl text-white tracking-tight">
              SOLDIER EYE<span className="text-accent">.</span>
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {profile?.full_name || 'Officer'} · {profile?.post || 'North Tower'} · {profile?.role || 'Guard'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="pulse-dot"/>
              <span className="text-xs text-gray-500">Live</span>
            </div>
            <button onClick={signOut} className="w-9 h-9 rounded-xl bg-surface2 border border-border flex items-center justify-center text-gray-500 hover:text-white transition-colors">
              <LogOut size={16}/>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scroll-content">
        {/* Stats */}
        <SectionHeader>Shift Overview</SectionHeader>
        <div className="grid grid-cols-2 gap-3 px-4 pb-2">
          <StatCard value={displayStats.open} label="Open Incidents" color="text-danger" badge={`${displayStats.inProgress} in progress`}/>
          <StatCard value={displayStats.today} label="Reported Today" color="text-accent" badge="This shift"/>
          <StatCard value={displayStats.total} label="Total Reports" color="text-accent2"/>
          <StatCard value="5/8" label="Patrol Checks" color="text-success" badge="On schedule"/>
        </div>

        {/* Incident feed */}
        <SectionHeader>Recent Incidents</SectionHeader>

        {loading ? (
          <div className="px-4 space-y-3">
            {[1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-2xl"/>)}
          </div>
        ) : displayIncidents.length === 0 ? (
          <EmptyState icon="🛡️" title="All clear" subtitle="No incidents reported this shift"/>
        ) : (
          displayIncidents.map(inc => (
            <IncidentCard
              key={inc.id}
              incident={inc}
              onClick={() => navigate(`/incidents/${inc.id}`, { state: { incident: inc } })}
            />
          ))
        )}
        <div className="h-4"/>
      </div>
    </AppLayout>
  )
}