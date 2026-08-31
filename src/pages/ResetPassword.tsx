import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export function ResetPassword() {
  const { user, updatePassword, signOut } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!user) {
      setErrorMsg('This reset link is no longer active. Request a new password reset email.')
      setStatus('error')
      return
    }
    if (password.length < 8) {
      setErrorMsg('Use at least 8 characters for your new password.')
      setStatus('error')
      return
    }
    if (password !== confirm) {
      setErrorMsg('The passwords do not match.')
      setStatus('error')
      return
    }

    setStatus('saving')
    const { error } = await updatePassword(password)
    if (error) {
      setErrorMsg(error)
      setStatus('error')
      return
    }

    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="mx-auto max-w-sm rounded-2xl border border-nebula-violet/25 bg-gradient-to-b from-[rgba(26,18,51,0.55)] to-[rgba(10,10,24,0.55)] p-7 text-center shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <h1 className="m-0 font-display text-2xl font-bold text-starlight">Set a new password</h1>
      <p className="mt-2 text-sm text-muted">Choose a new password for the GigaMusic owner account.</p>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3">
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password"
          className="rounded-lg border border-starlight/[0.14] bg-white/[0.03] px-3.5 py-2.5 text-sm text-starlight outline-none placeholder:text-[#7A7699]"
        />
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirm new password"
          className="rounded-lg border border-starlight/[0.14] bg-white/[0.03] px-3.5 py-2.5 text-sm text-starlight outline-none placeholder:text-[#7A7699]"
        />
        <button
          type="submit"
          disabled={status === 'saving'}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-nebula-violet to-aurora-teal px-5 py-2.5 font-display text-sm font-bold text-[#0A0A18] disabled:opacity-50"
        >
          <KeyRound size={15} /> {status === 'saving' ? 'Saving…' : 'Save new password'}
        </button>
        {status === 'error' && <p className="text-xs text-stardust-pink">{errorMsg}</p>}
      </form>
    </div>
  )
}
