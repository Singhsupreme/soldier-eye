import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { SectionHeader, Skeleton, SevPill, StatusPill } from '../components/UI'
import AppLayout from '../components/AppLayout'
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'

const DEMO_DATA = {
  stats: { total: 42, open: 5, resolved: 35, critical: 3 },
  byType: [
    { type: 'Unauthorized Access', count: 12 },
    { type: 'Suspicious Person', count: 9 },
    { type: 'Equipment Malfunction', count: 8 },
    { type: 'Theft / Vandalism', count: 6 },
    { type: 'Trespassing', count: 4 },
    { type: 'Medical Emergency', count: 3 },
  ],
  bySeverity: [
    { sev: 'critical', count: 3, color: '#E24B4A' },
    { sev: 'high', count: 11, color: '#EF9F27' },
    { sev: 'medium', count: 18, color: '#3B82F6' },
    { sev: 'low', count: 10, color: '#1D9E75' },
  ],
  recent: [
    { id: '1', type: 'Unauthorized Access', severity: 'critical', status: 'open', location: 'Gate B – Level 2', created_at: new Date(Date.now()-8*60000).toISOString() },
    { id: '2', type: 'Suspicious Person', severity: 'high', status: 'in_progress', location: 'Lobby Entrance', created_at: new Date(Date.now()-2.5*3600000).toISOString() },
    { id: '3', type: 'Equipment Malfunction', severity: 'medium', status: 'resolved', location: 'CCTV Room', created_at: new Date(Date.now()-18*3600000).toISOString() },
  ]
}

function StatTile({ icon: Icon, value, label, color }) {
  return (
    <div className="glass-card p-4 flex flex-col gap-1">
      <Icon size={18} className={color}/>
      <div className={`font-syne font-bold text-2xl mt-1 ${color}`}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  )
}

export default function AnalyticsPage() {
  const [data, setData] = useState(DEMO_DATA)
  const [loading, setLoading] = useState(false)
  const maxCount = Math.max(...data.byType.map(d => d.count))

  return (
    <AppLayout>
      <div className="bg-surface border-b border-border px-4 pt-4 pb-3 flex-shrink-0">
        <h2 className="font-syne font-bold text-lg text-white">Analytics</h2>
        <p className="text-xs text-gray-500 mt-0.5">Management overview · All locations</p>
      </div>

      <div className="flex-1 overflow-y-auto scroll-content">
        <SectionHeader>Overview</SectionHeader>
        <div className="grid grid-cols-2 gap-3 px-4 mb-2">
          <StatTile icon={BarChart3} value={data.stats.total} label="Total Reports" color="text-accent"/>
          <StatTile icon={AlertTriangle} value={data.stats.open} label="Open Incidents" color="text-danger"/>
          <StatTile icon={TrendingUp} value={data.stats.critical} label="Critical (30 days)" color="text-warn"/>
          <StatTile icon={CheckCircle} value={data.stats.resolved} label="Resolved" color="text-success"/>
        </div>

        {/* By type bar chart */}
        <SectionHeader>Incidents by Type</SectionHeader>
        <div className="mx-4 glass-card p-4 mb-4">
          <div className="space-y-3">
            {data.byType.map(({ type, count }) => (
              <div key={type}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400 truncate pr-2">{type}</span>
                  <span className="text-white font-medium flex-shrink-0">{count}</span>
                </div>
                <div className="bg-surface3 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-700"
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Severity breakdown */}
        <SectionHeader>Severity Breakdown</SectionHeader>
        <div className="grid grid-cols-4 gap-2 px-4 mb-4">
          {data.bySeverity.map(({ sev, count, color }) => (
            <div key={sev} className="glass-card p-3 text-center">
              <div className="font-syne font-bold text-xl" style={{ color }}>{count}</div>
              <div className="text-[10px] text-gray-500 capitalize mt-0.5">{sev}</div>
            </div>
          ))}
        </div>

        {/* Recent for managers */}
        <SectionHeader>Recent Incidents</SectionHeader>
        <div className="px-4 space-y-3 pb-6">
          {data.recent.map(inc => (
            <div key={inc.id} className="glass-card p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="font-syne font-bold text-sm text-white">{inc.type}</span>
                <SevPill severity={inc.severity}/>
              </div>
              <div className="text-xs text-gray-500 mb-2">{inc.location}</div>
              <StatusPill status={inc.status}/>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}