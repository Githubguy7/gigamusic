import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { LockKeyhole } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export function Login() {
  const { user, isAdmin, signInWithPassword, signOut } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'signing-in' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (user && isAdmin) return <Navigate to="/upload" replace />

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) return
    setStatus('signing-in')
    setErrorMsg(null)

    const { error } = await signInWithPassword(email.trim(), password)
    if (error) {
      setErrorMsg(error)
      setStatus('error')
      return
    }

    setStatus('idle')
  }

  if (user && !isAdmin) {
    return (
      <div className="mx-auto max-w-sm rounded-2xl border border-nebula-violet/25 bg-gradient-to-b from-[rgba(26,18,51,0.55)] to-[rgba(10,10,24,0.55)] p-7 text-center shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <h1 className="m-0 font-display text-2xl font-bold text-starlight">Owner access only</h1>
        <p className="mt-3 text-sm text-muted">This account is signed in, but it is not authorized to manage GigaMusic.</p>
        <button onClick={() => void signOut()} className="mt-5 rounded-full border border-starlight/15 px-5 py-2.5 text-sm text-starlight">
          Sign out
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-sm rounded-2xl border border-nebula-violet/25 bg-gradient-to-b from-[rgba(26,18,51,0.55)] to-[rgba(10,10,24,0.55)] p-7 text-center shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <h1 className="m-0 font-display text-2xl font-bold text-starlight">GigaMusic Owner</h1>
      <p className="mt-2 text-sm text-muted">Private administration sign-in.</p>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3">
        <input
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Owner email"
          className="rounded-lg border border-starlight/[0.14] bg-white/[0.03] px-3.5 py-2.5 text-sm text-starlight outline-none placeholder:text-[#7A7699]"
        />
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="rounded-lg border border-starlight/[0.14] bg-white/[0.03] px-3.5 py-2.5 text-sm text-starlight outline-none placeholder:text-[#7A7699]"
        />
        <button
          type="submit"
          disabled={status === 'signing-in'}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-nebula-violet to-aurora-teal px-5 py-2.5 font-display text-sm font-bold text-[#0A0A18] disabled:opacity-50"
        >
          <LockKeyhole size={15} /> {status === 'signing-in' ? 'Signing in…' : 'Sign in'}
        </button>
        {status === 'error' && <p className="text-xs text-stardust-pink">{errorMsg}</p>}
      </form>
    </div>
  )
}
