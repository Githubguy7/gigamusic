import { useRef } from 'react'

interface Star {
  id: number
  top: number
  left: number
  size: number
  delay: number
  dur: number
}

interface ShootingStar {
  id: number
  top: number
  left: number
  delay: number
}

export function Starfield() {
  const stars = useRef<Star[]>(
    Array.from({ length: 90 }).map((_, i) => ({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: Math.random() * 2 + 0.6,
      delay: Math.random() * 6,
      dur: Math.random() * 3 + 2.5,
    })),
  ).current

  const shootingStars = useRef<ShootingStar[]>(
    Array.from({ length: 4 }).map((_, i) => ({
      id: i,
      top: Math.random() * 50,
      left: Math.random() * 60 + 20,
      delay: i * 5 + Math.random() * 4,
    })),
  ).current

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 20% 10%, rgba(139,111,232,0.16), transparent 60%), radial-gradient(ellipse 70% 50% at 85% 30%, rgba(79,216,196,0.10), transparent 60%), radial-gradient(ellipse 90% 70% at 50% 100%, rgba(232,143,209,0.10), transparent 60%), #060714',
        }}
      />
      {stars.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full bg-starlight motion-reduce:opacity-50 motion-reduce:animate-none"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: s.size,
            height: s.size,
            opacity: 0.7,
            animation: `giga-twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
      {shootingStars.map((s) => (
        <div
          key={s.id}
          className="absolute h-0.5 w-0.5 motion-reduce:hidden"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            animation: `giga-shoot 6s linear ${s.delay}s infinite`,
          }}
        >
          <div
            className="h-0.5 rounded"
            style={{
              width: 90,
              background: 'linear-gradient(90deg, #F5C86B, transparent)',
              transform: 'rotate(-32deg) translateX(-90px)',
            }}
          />
        </div>
      ))}
    </div>
  )
}
