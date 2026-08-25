import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export function Login() {
  const { user, signInWithMagicLink } = useAuth()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (user) return <Navigate to="/upload" replace />

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('sending')
    const { error } = await signInWithMagicLink(email.trim())
    if (error) {
      setErrorMsg(error)
      setStatus('error')
    } else {
      setStatus('sent')
    }
  }

  return (
    <div className="mx-auto max-w-sm rounded-2xl border border-nebula-violet/25 bg-gradient-to-b from-[rgba(26,18,51,0.55)] to-[rgba(10,10,24,0.55)] p-7 text-center shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <h1 className="m-0 font-display text-2xl font-bold text-starlight">Sign in</h1>
      <p className="mt-2 text-sm text-muted">We'll email you a magic link — no password needed.</p>

      {status === 'sent' ? (
        <p className="mt-6 text-sm text-aurora-teal">
          Check <span className="font-medium">{email}</span> for a sign-in link.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="rounded-lg border border-starlight/[0.14] bg-white/[0.03] px-3.5 py-2.5 text-sm text-starlight outline-none placeholder:text-[#7A7699]"
          />
          <button
            type="submit"
            disabled={status === 'sending'}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-nebula-violet to-aurora-teal px-5 py-2.5 font-display text-sm font-bold text-[#0A0A18] disabled:opacity-50"
          >
            <Mail size={15} /> {status === 'sending' ? 'Sending…' : 'Send magic link'}
          </button>
          {status === 'error' && <p className="text-xs text-stardust-pink">{errorMsg}</p>}
        </form>
      )}
    </div>
  )
}
