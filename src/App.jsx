import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ReportPage from './pages/ReportPage'
import PatrolPage from './pages/PatrolPage'
import IncidentDetailPage from './pages/IncidentDetailPage'
import IncidentsPage from './pages/IncidentsPage'
import AnalyticsPage from './pages/AnalyticsPage'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-surface2 border border-border flex items-center justify-center">
          <span className="text-accent font-syne font-bold text-lg">S</span>
        </div>
        <div className="ai-thinking"><span/><span/><span/></div>
      </div>
    </div>
  )
  return user ? children : <Navigate to="/login" replace/>
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace/> : <LoginPage/>}/>
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage/></ProtectedRoute>}/>
      <Route path="/report" element={<ProtectedRoute><ReportPage/></ProtectedRoute>}/>
      <Route path="/patrol" element={<ProtectedRoute><PatrolPage/></ProtectedRoute>}/>
      <Route path="/incidents" element={<ProtectedRoute><IncidentsPage/></ProtectedRoute>}/>
      <Route path="/incidents/:id" element={<ProtectedRoute><IncidentDetailPage/></ProtectedRoute>}/>
      <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage/></ProtectedRoute>}/>
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace/>}/>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes/>
      </BrowserRouter>
    </AuthProvider>
  )
}