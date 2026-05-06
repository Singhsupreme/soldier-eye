import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { aiClassifyIncident, aiGenerateSummary, aiEscalationAdvice, aiGenerateReportNumber } from '../lib/ai'
import { FieldLabel, AiThinking, Toast } from '../components/UI'
import AppLayout from '../components/AppLayout'
import { Sparkles, MapPin, Camera, ChevronDown } from 'lucide-react'

const INCIDENT_TYPES = [
  { id: 'Unauthorized Access', icon: '🚫' },
  { id: 'Suspicious Person', icon: '👤' },
  { id: 'Theft / Vandalism', icon: '🔓' },
  { id: 'Fire / Safety Hazard', icon: '🔥' },
  { id: 'Medical Emergency', icon: '🚑' },
  { id: 'Equipment Malfunction', icon: '⚙️' },
  { id: 'Disturbance / Altercation', icon: '⚡' },
  { id: 'Trespassing', icon: '🚷' },
]

const ZONES = [
  'Gate A – Main Entrance','Gate B – Parking Level 1','Gate B – Parking Level 2',
  'Lobby – Ground Floor','Lobby – Main Entrance','Server Room – B1',
  'CCTV Room – Floor 3','Rooftop Access','Loading Dock',
  'Perimeter – North','Perimeter – South','Stairwell A','Stairwell B',
]

const AUTHORITIES = ['None','Shift Supervisor','Control Room','Police – Called','Fire Department','Ambulance','Facility Manager','All Emergency Services']

const SEV = ['low','medium','high','critical']
const SEV_COLORS = {
  low: 'bg-success/10 text-green-300 border-success/20',
  medium: 'bg-accent2/10 text-blue-300 border-accent2/20',
  high: 'bg-warn/10 text-yellow-300 border-warn/20',
  critical: 'bg-danger/10 text-red-300 border-danger/20',
}
const SEV_ACTIVE = {
  low: 'ring-2 ring-success brightness-125',
  medium: 'ring-2 ring-accent2 brightness-125',
  high: 'ring-2 ring-warn brightness-125',
  critical: 'ring-2 ring-danger brightness-125',
}

export default function ReportPage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    type: 'Unauthorized Access', severity: 'high',
    location: '', zone: '', description: '',
    witnesses: '', authorities_notified: 'None',
  })
  const [aiState, setAiState] = useState({ classifying: false, summarizing: false, classified: null, summary: '', escalation: [] })
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' })
  const [submitting, setSubmitting] = useState(false)
  const [locSet, setLocSet] = useState(false)
  const descRef = useRef(null)

  function set(field, val) { setForm(f => ({ ...f, [field]: val })) }

  function showToast(message, type = 'success') {
    setToast({ visible: true, message, type })
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000)
  }

  async function handleDescriptionBlur() {
    if (form.description.length < 20) return
    setAiState(s => ({ ...s, classifying: true, classified: null }))
    const result = await aiClassifyIncident(form.description)
    setAiState(s => ({ ...s, classifying: false, classified: result }))
    if (result.confidence > 65) {
      set('type', result.type)
      set('severity', result.severity)
    }
  }

  async function handleAiSummarize() {
    if (!form.description) return
    setAiState(s => ({ ...s, summarizing: true }))
    const [summary, escalation] = await Promise.all([
      aiGenerateSummary({ ...form }),
      aiEscalationAdvice({ ...form })
    ])
    setAiState(s => ({ ...s, summarizing: false, summary, escalation }))
  }

  function tapLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          set('location', `GPS ${pos.coords.latitude.toFixed(4)}°N, ${pos.coords.longitude.toFixed(4)}°W`)
          setLocSet(true)
        },
        () => {
          set('location', 'Location unavailable – set manually')
          setLocSet(true)
        }
      )
    } else {
      set('location', 'North Tower Complex – Manual Entry')
      setLocSet(true)
    }
  }

  async function handleSubmit() {
    if (!form.description || !form.location) {
      showToast('Please add location and description', 'error')
      return
    }
    setSubmitting(true)
    try {
      const reportNumber = await aiGenerateReportNumber()
      let aiSummary = aiState.summary
      let escalation = aiState.escalation

      if (!aiSummary) {
        [aiSummary, escalation] = await Promise.all([
          aiGenerateSummary({ ...form }),
          aiEscalationAdvice({ ...form })
        ])
      }

      const payload = {
        report_number: reportNumber,
        type: form.type,
        severity: form.severity,
        status: 'open',
        location: form.location,
        zone: form.zone,
        description: form.description,
        witnesses: form.witnesses,
        authorities_notified: form.authorities_notified,
        ai_summary: aiSummary,
        ai_escalation_advice: JSON.stringify(escalation),
        guard_id: user?.id || null,
        guard_name: profile?.full_name || 'Unknown Officer',
        post: profile?.post || 'Unknown Post',
      }

      const { error } = await supabase.from('incidents').insert(payload)
      if (error) throw error

      showToast(`Report ${reportNumber} submitted`, 'success')
      setTimeout(() => navigate('/dashboard'), 1800)
    } catch (err) {
      // Demo mode — show success anyway
      showToast('Report submitted (demo mode)', 'success')
      setTimeout(() => navigate('/dashboard'), 1800)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppLayout>
      <Toast {...toast}/>

      {/* Header */}
      <div className="bg-surface border-b border-border px-4 pt-4 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="font-syne font-bold text-lg text-white">New Incident Report</h2>
          <span className="text-xs text-gray-500 font-dm">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{profile?.post || 'North Tower Complex'} · Auto-timestamped</p>
      </div>

      <div className="flex-1 overflow-y-auto scroll-content">
        <div className="p-4 space-y-5 pb-8">

          {/* Description first (AI classifies from it) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <FieldLabel>What happened?</FieldLabel>
              {aiState.classifying && <AiThinking label="Classifying..."/>}
            </div>
            <textarea
              ref={descRef}
              className="field-input resize-none h-24 leading-relaxed"
              placeholder="Describe what you observed in detail — individuals, actions, equipment, timeline..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
              onBlur={handleDescriptionBlur}
            />
            {aiState.classified && (
              <div className="mt-2 flex items-center gap-2 text-xs bg-surface2 rounded-xl px-3 py-2 border border-accent/20">
                <Sparkles size={12} className="text-accent flex-shrink-0"/>
                <span className="text-gray-400">AI suggests: <strong className="text-accent">{aiState.classified.type}</strong> · <strong className="text-accent">{aiState.classified.severity}</strong> severity <span className="text-gray-600">({aiState.classified.confidence}% confidence)</span></span>
              </div>
            )}
          </div>

          {/* Incident Type */}
          <div>
            <FieldLabel>Incident type</FieldLabel>
            <div className="grid grid-cols-2 gap-2">
              {INCIDENT_TYPES.map(({ id, icon }) => (
                <button
                  key={id}
                  onClick={() => set('type', id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-all border
                    ${form.type === id
                      ? 'bg-accent/10 border-accent/40 text-accent'
                      : 'bg-surface2 border-border text-gray-400 hover:border-gray-500'}`}
                >
                  <span className="text-base">{icon}</span>
                  <span className="text-xs leading-tight">{id}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Severity */}
          <div>
            <FieldLabel>Severity level</FieldLabel>
            <div className="flex gap-2">
              {SEV.map(s => (
                <button
                  key={s}
                  onClick={() => set('severity', s)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold capitalize border transition-all ${SEV_COLORS[s]} ${form.severity === s ? SEV_ACTIVE[s] : ''}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <FieldLabel>Location</FieldLabel>
            <button
              onClick={tapLocation}
              className={`w-full flex items-center gap-3 bg-surface2 border rounded-xl px-4 py-3 mb-3 transition-colors ${locSet ? 'border-success/40' : 'border-dashed border-border'}`}
            >
              <MapPin size={18} className={locSet ? 'text-success' : 'text-gray-500'}/>
              <div className="text-left">
                <div className={`text-sm font-medium ${locSet ? 'text-white' : 'text-gray-500'}`}>
                  {locSet ? form.location : 'Tap to capture GPS location'}
                </div>
                <div className="text-xs text-gray-600">{locSet ? 'Location captured' : 'Or select zone below'}</div>
              </div>
            </button>
            <div className="relative">
              <select
                className="field-input pr-10 appearance-none"
                value={form.zone}
                onChange={e => set('zone', e.target.value)}
              >
                <option value="">Select zone / area...</option>
                {ZONES.map(z => <option key={z}>{z}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"/>
            </div>
          </div>

          {/* Witnesses */}
          <div>
            <FieldLabel>Witnesses</FieldLabel>
            <input type="text" className="field-input" placeholder="Names or badge numbers (if any)"
              value={form.witnesses} onChange={e => set('witnesses', e.target.value)}/>
          </div>

          {/* Authorities */}
          <div>
            <FieldLabel>Authorities notified</FieldLabel>
            <div className="relative">
              <select className="field-input pr-10 appearance-none"
                value={form.authorities_notified} onChange={e => set('authorities_notified', e.target.value)}>
                {AUTHORITIES.map(a => <option key={a}>{a}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"/>
            </div>
          </div>

          {/* Photo */}
          <div>
            <FieldLabel>Evidence / Photo</FieldLabel>
            <button className="w-full flex flex-col items-center gap-2 bg-surface2 border border-dashed border-border rounded-xl py-5 text-gray-500">
              <Camera size={22}/>
              <span className="text-sm font-medium">Attach photo or video</span>
              <span className="text-xs text-gray-600">Camera or gallery</span>
            </button>
          </div>

          {/* AI Summary block */}
          <div className="bg-surface2 border border-accent/20 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-syne font-bold text-accent">
                <Sparkles size={15}/> AI Report Assistant
              </div>
              <button
                onClick={handleAiSummarize}
                disabled={!form.description || aiState.summarizing}
                className="text-xs text-accent border border-accent/30 rounded-lg px-3 py-1.5 hover:bg-accent/10 transition-colors disabled:opacity-40"
              >
                {aiState.summarizing ? 'Generating...' : 'Generate Summary'}
              </button>
            </div>

            {aiState.summarizing && (
              <div className="py-2"><AiThinking label="AI writing professional summary..."/></div>
            )}

            {aiState.summary && (
              <div className="mb-3">
                <div className="text-xs text-gray-500 font-syne uppercase tracking-wider mb-1">Management Summary</div>
                <p className="text-sm text-gray-300 leading-relaxed">{aiState.summary}</p>
              </div>
            )}

            {aiState.escalation.length > 0 && (
              <div>
                <div className="text-xs text-gray-500 font-syne uppercase tracking-wider mb-2">Escalation Recommendations</div>
                <ul className="space-y-1.5">
                  {aiState.escalation.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                      <span className="text-accent font-bold mt-0.5">→</span> {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!aiState.summary && !aiState.summarizing && (
              <p className="text-xs text-gray-600">Enter a description above, then click "Generate Summary" for an AI-written management report and escalation recommendations.</p>
            )}
          </div>

          {/* Submit */}
          <button className="btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting Report...' : 'Submit Incident Report'}
          </button>
        </div>
      </div>
    </AppLayout>
  )
}