import { useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, FilePlus, MapPin, BarChart3, Settings } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const guardNav = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/report', icon: FilePlus, label: 'Report' },
  { path: '/patrol', icon: MapPin, label: 'Patrol' },
]
const managerNav = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { path: '/incidents', icon: FilePlus, label: 'Incidents' },
  { path: '/patrol', icon: MapPin, label: 'Patrol' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const isManager = profile?.role === 'manager' || profile?.role === 'supervisor'
  const navItems = isManager ? managerNav : guardNav

  return (
    <nav className="flex-shrink-0 bg-surface border-t border-border safe-bottom">
      <div className="flex">
        {navItems.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${active ? 'text-accent' : 'text-gray-500'}`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8}/>
              <span className="text-[10px] font-medium font-syne">{label}</span>
              {active && <span className="w-1 h-1 rounded-full bg-accent absolute bottom-1"/>}
            </button>
          )
        })}
      </div>
    </nav>
  )
}