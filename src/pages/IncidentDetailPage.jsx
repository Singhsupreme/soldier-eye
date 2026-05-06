import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { SevPill, StatusPill, BackButton, Toast } from '../components/UI'
import { Sparkles, MapPin, Clock, User, Shield } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

const statusFlow = { open: 'in_progress', in_progress: 'resolved', resolved: 'closed' }
const statusLabels = { open: 'Mark In Progress', in_progress: 'Mark Resolved', resolved: 'Close Report' }

export default function IncidentDetailPage() {
  const { id } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [incident, setIncident] = useState(state?.incident || null)
  const [updating, setUpdating] = useState(false)
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' })

  useEffect(() => {
    if (id && id !== '1' && id !== '2' && id !== '3' && id !== '4') {
      supabase.from('incidents').select('*').eq('id', id).single().then(({ data }) => {
        if (data) setIncident(data)
      })
    }
  }, [id])

  function showToast(message, type = 'success') {
    setToast({ visible: true, message, type })
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000)
  }

  async function updateStatus() {
    if (!incident || !statusFlow[incident.status]) return
    setUpdating(true)
    const newStatus = statusFlow[incident.status]
    const { error } = await supabase.from('incidents').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', incident.id)
    if (!error) {
      setIncident(i => ({ ...i, status: newStatus }))
      showToast(`Status updated to ${newStatus.replace('_', ' ')}`)
    } else {
      // demo mode
      setIncident(i => ({ ...i, status: newStatus }))
      showToast('Status updated (demo mode)')
    }
    setUpdating(false)
  }

  const escalation = (() => {
    try { return incident?.ai_escalation_advice ? JSON.parse(incident.ai_escalation_advice) : [] }
    catch { return [] }
  })()

  if (!incident) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  const isManager = profile?.role === 'manager' || profile?.role === 'supervisor'

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-bg overflow-hidden">
      <Toast {...toast}/>

      {/* Header */}
      <div className="bg-surface border-b border-border px-4 pt-4 pb-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <BackButton onClick={() => navigate(-1)}/>
          <div className="flex-1 min-w-0">
            <h2 className="font-syne font-bold text-base text-white truncate">{incident.type}</h2>
            <p className="text-xs text-gray-500">{incident.report_number || `INC-${incident.id?.slice(0,8).toUpperCase()}`}</p>
          </div>
          <SevPill severity={incident.severity}/>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-6" style={{ scrollbarWidth: 'none' }}>
        {/* Key info */}
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-gray-500 flex-shrink-0"/>
            <span className="text-sm text-white">{incident.location}{incident.zone ? ` · ${incident.zone}` : ''}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-gray-500 flex-shrink-0"/>
            <span className="text-sm text-gray-400">
              {incident.created_at
                ? `${format(new Date(incident.created_at), 'MMM d, yyyy · h:mm a')} (${formatDistanceToNow(new Date(incident.created_at), { addSuffix: true })})`
                : 'Time unknown'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <User size={14} className="text-gray-500 flex-shrink-0"/>
            <span className="text-sm text-gray-400">{incident.guard_name || 'Unknown Officer'} · {incident.post || ''}</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-gray-500 flex-shrink-0"/>
            <StatusPill status={incident.status}/>
          </div>
        </div>

        {/* Description */}
        <div className="glass-card p-4">
          <div className="text-xs font-syne font-semibold text-gray-500 uppercase tracking-widest mb-2">Description</div>
          <p className="text-sm text-gray-300 leading-relaxed">{incident.description || 'No description provided.'}</p>
        </div>

        {/* Witnesses / Authorities */}
        {(incident.witnesses || incident.authorities_notified) && (
          <div className="glass-card p-4 space-y-3">
            {incident.witnesses && (
              <div>
                <div className="text-xs font-syne text-gray-500 uppercase tracking-widest mb-1">Witnesses</div>
                <p className="text-sm text-gray-300">{incident.witnesses}</p>
              </div>
            )}
            {incident.authorities_notified && incident.authorities_notified !== 'None' && (
              <div>
                <div className="text-xs font-syne text-gray-500 uppercase tracking-widest mb-1">Authorities Notified</div>
                <p className="text-sm text-gray-300">{incident.authorities_notified}</p>
              </div>
            )}
          </div>
        )}

        {/* AI Summary */}
        {(incident.ai_summary || escalation.length > 0) && (
          <div className="bg-surface2 border border-accent/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-sm font-syne font-bold text-accent mb-3">
              <Sparkles size={14}/> AI Analysis
            </div>
            {incident.ai_summary && (
              <div className="mb-4">
                <div className="text-xs text-gray-500 font-syne uppercase tracking-wider mb-1">Management Summary</div>
                <p className="text-sm text-gray-300 leading-relaxed">{incident.ai_summary}</p>
              </div>
            )}
            {escalation.length > 0 && (
              <div>
                <div className="text-xs text-gray-500 font-syne uppercase tracking-wider mb-2">Escalation Recommendations</div>
                <ul className="space-y-1.5">
                  {escalation.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                      <span className="text-accent font-bold mt-0.5">→</span> {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Timeline */}
        <div className="glass-card p-4">
          <div className="text-xs font-syne font-semibold text-gray-500 uppercase tracking-widest mb-3">Activity Timeline</div>
          <div className="space-y-3">
            {[
              { dot: true, label: 'Report submitted', sub: `${incident.guard_name} · ${incident.created_at ? format(new Date(incident.created_at), 'h:mm a') : ''}` },
              incident.status !== 'open' && { dot: false, label: 'Escalated to supervisor', sub: 'Auto-notified (High+ severity)' },
              incident.status === 'resolved' && { dot: false, label: 'Marked resolved', sub: 'Status updated' },
            ].filter(Boolean).map((item, i, arr) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5 ${item.dot ? 'bg-accent' : 'bg-gray-600'}`}/>
                  {i < arr.length - 1 && <div className="w-px flex-1 bg-border mt-1"/>}
                </div>
                <div className="pb-2">
                  <div className="text-sm text-white font-medium">{item.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{item.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action bar */}
      {(isManager || incident.status !== 'closed') && (
        <div className="bg-surface border-t border-border p-4 flex gap-3 flex-shrink-0">
          <button onClick={() => navigate(-1)} className="flex-1 py-3 rounded-xl bg-surface2 border border-border text-sm text-gray-400 font-medium">
            Back
          </button>
          {statusFlow[incident.status] && (
            <button onClick={updateStatus} disabled={updating}
              className="flex-1 py-3 rounded-xl bg-accent text-black font-syne font-bold text-sm disabled:opacity-50">
              {updating ? 'Updating...' : statusLabels[incident.status]}
            </button>
          )}
        </div>
      )}
    </div>
  )
}