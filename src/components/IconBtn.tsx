import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'

const baseClasses =
  'flex h-[34px] w-[34px] items-center justify-center rounded-[10px] border transition-colors duration-150'

function stateClasses(active?: boolean) {
  return active
    ? 'border-aurora-teal/50 bg-aurora-teal/10 text-aurora-teal'
    : 'border-starlight/10 bg-white/[0.03] text-muted hover:border-starlight/30 hover:text-starlight'
}

interface IconBtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  active?: boolean
}

export function IconBtn({ children, active, className = '', ...props }: IconBtnProps) {
  return (
    <button type="button" className={`${baseClasses} ${stateClasses(active)} ${className}`} {...props}>
      {children}
    </button>
  )
}

interface IconLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode
}

/** Same look as IconBtn, but a real anchor — for external share/upload links. */
export function IconLink({ children, className = '', ...props }: IconLinkProps) {
  return (
    <a className={`${baseClasses} ${stateClasses(false)} ${className}`} {...props}>
      {children}
    </a>
  )
}
