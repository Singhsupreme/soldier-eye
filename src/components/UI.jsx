import { AlertCircle, CheckCircle, Info } from 'lucide-react'

export function SevPill({ severity }) {
  const map = {
    critical: 'sev-critical', high: 'sev-high', medium: 'sev-medium', low: 'sev-low'
  }
  return (
    <span className={`pill ${map[severity] || 'sev-low'}`}>
      {severity?.charAt(0).toUpperCase() + severity?.slice(1)}
    </span>
  )
}

export function StatusPill({ status }) {
  const map = {
    open: 'status-open', in_progress: 'status-progress',
    resolved: 'status-resolved', closed: 'status-resolved'
  }
  const labels = { open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed' }
  return <span className={`pill ${map[status] || 'status-open'}`}>{labels[status] || status}</span>
}

export function Toast({ message, type = 'success', visible }) {
  const icons = { success: <CheckCircle size={15}/>, error: <AlertCircle size={15}/>, info: <Info size={15}/> }
  const colors = { success: 'bg-success', error: 'bg-danger', info: 'bg-accent2' }
  return (
    <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl text-white text-sm font-medium shadow-2xl transition-all duration-300 ${colors[type]} ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
      {icons[type]}
      {message}
    </div>
  )
}

export function Skeleton({ className = '' }) {
  return <div className={`shimmer ${className}`} />
}

export function AiThinking({ label = 'AI analyzing...' }) {
  return (
    <div className="flex items-center gap-2 text-accent text-xs font-medium">
      <div className="ai-thinking">
        <span/><span/><span/>
      </div>
      {label}
    </div>
  )
}

export function EmptyState({ icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="text-4xl mb-4">{icon}</div>
      <div className="font-syne font-bold text-base text-white mb-2">{title}</div>
      <div className="text-sm text-gray-500">{subtitle}</div>
    </div>
  )
}

export function FieldLabel({ children }) {
  return (
    <label className="block text-xs font-medium text-gray-500 uppercase tracking-widest mb-2 font-syne">
      {children}
    </label>
  )
}

export function SectionHeader({ children }) {
  return (
    <div className="px-4 pt-5 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-widest font-syne">
      {children}
    </div>
  )
}

export function BackButton({ onClick }) {
  return (
    <button onClick={onClick} className="w-9 h-9 rounded-xl bg-surface2 border border-border flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M15 18l-6-6 6-6"/>
      </svg>
    </button>
  )
}