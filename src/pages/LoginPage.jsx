import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Shield, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await signIn(email, password)
    if (err) {
      setError(err.message)
      setLoading(false)
    } else {
      navigate('/dashboard')
    }
  }

  // Demo login
  async function demoLogin(role) {
    const demos = {
      guard: { email: 'guard@soldiereye.demo', password: 'demo1234' },
      manager: { email: 'manager@soldiereye.demo', password: 'demo1234' }
    }
    const creds = demos[role]
    setEmail(creds.email)
    setPassword(creds.password)
    setLoading(true)
    setError('')
    const { error: err } = await signIn(creds.email, creds.password)
    if (err) {
      setError('Demo accounts not configured yet. Please set up Supabase and create test users.')
      setLoading(false)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 max-w-md mx-auto">
      {/* Logo */}
      <div className="text-center mb-10 fade-in">
        <div className="w-20 h-20 rounded-3xl bg-surface2 border border-border flex items-center justify-center mx-auto mb-5">
          <Shield size={36} className="text-accent"/>
        </div>
        <h1 className="font-syne font-bold text-3xl text-white tracking-tight">
          SOLDIER EYE<span className="text-accent">.</span>
        </h1>
        <p className="text-gray-500 text-sm mt-1 font-dm">Security Operations Platform</p>
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} className="w-full space-y-4 fade-in">
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-widest mb-2 font-syne">
            Email / Badge ID
          </label>
          <input
            type="email"
            className="field-input"
            placeholder="officer@company.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-widest mb-2 font-syne">
            Password
          </label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              className="field-input pr-12"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button type="button" onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 p-1">
              {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-950/40 border border-danger/30 rounded-xl p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Authenticating...' : 'Sign In'}
        </button>
      </form>

      {/* Demo buttons */}
      <div className="w-full mt-6">
        <div className="text-xs text-gray-600 text-center mb-3 font-dm">Demo access</div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => demoLogin('guard')}
            className="bg-surface2 border border-border rounded-xl py-3 text-sm text-gray-400 font-medium hover:border-accent/40 hover:text-accent transition-colors">
            🛡️ Guard View
          </button>
          <button onClick={() => demoLogin('manager')}
            className="bg-surface2 border border-border rounded-xl py-3 text-sm text-gray-400 font-medium hover:border-accent/40 hover:text-accent transition-colors">
            📊 Manager View
          </button>
        </div>
      </div>

      {/* Setup notice */}
      <div className="mt-8 bg-surface2 border border-border rounded-2xl p-4 w-full">
        <p className="text-xs text-gray-500 font-syne font-semibold uppercase tracking-wider mb-2">Setup Required</p>
        <p className="text-xs text-gray-500 leading-relaxed">
          Add your <span className="text-accent font-medium">VITE_SUPABASE_URL</span> and{' '}
          <span className="text-accent font-medium">VITE_SUPABASE_ANON_KEY</span> to a <code className="text-accent">.env</code> file,
          then run the SQL schema from <code className="text-gray-400">src/lib/supabase.js</code>.
        </p>
      </div>
    </div>
  )
}