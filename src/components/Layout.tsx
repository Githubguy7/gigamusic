import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Upload, ShieldCheck, LogOut } from 'lucide-react'
import { Starfield } from '@/components/Starfield'
import { useAuth } from '@/contexts/AuthContext'

export function Layout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth()

  return (
    <div className="relative min-h-screen bg-void font-body">
      <Starfield />
      <div className="relative z-10 mx-auto max-w-[880px] px-6 pb-20 pt-10">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link to="/" className="inline-flex items-center gap-2 no-underline">
            <Sparkles size={18} className="text-comet-gold" />
            <span className="font-mono text-xs uppercase tracking-[2px] text-[#8B85B0]">gigamusic.org</span>
          </Link>
          <nav className="flex items-center gap-2">
            {user ? (
              <>
                <Link
                  to="/upload"
                  className="inline-flex items-center gap-1.5 rounded-full border border-nebula-violet/40 px-3.5 py-1.5 font-display text-[13px] font-bold text-starlight no-underline hover:border-nebula-violet/70"
                >
                  <Upload size={14} /> Upload
                </Link>
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-1.5 rounded-full border border-nebula-violet/40 px-3.5 py-1.5 font-display text-[13px] font-bold text-starlight no-underline hover:border-nebula-violet/70"
                >
                  <ShieldCheck size={14} /> Admin
                </Link>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-transparent px-3.5 py-1.5 font-display text-[13px] font-bold text-muted hover:text-starlight"
                >
                  <LogOut size={14} /> Sign out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 rounded-full border border-nebula-violet/40 px-3.5 py-1.5 font-display text-[13px] font-bold text-starlight no-underline hover:border-nebula-violet/70"
              >
                Sign in
              </Link>
            )}
          </nav>
        </header>
        {children}
      </div>
    </div>
  )
}
