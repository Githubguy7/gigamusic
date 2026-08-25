import { useRef } from 'react'
import type { CSSProperties } from 'react'

interface Star {
  id: number
  top: number
  left: number
  size: number
  delay: number
  dur: number
  bright: boolean
}

interface ShootingStar {
  id: number
  top: number
  left: number
  delay: number
  duration: number
  angle: number // degrees, clockwise from horizontal-right — direction of travel
  distance: number // px covered during the visible streak
  length: number // px, visual trail length
}

function makeShootingStar(id: number): ShootingStar {
  // Shallow, mostly-horizontal glide down-and-right — how a real meteor
  // trail reads — rather than a steep drop. The trail's own tilt (below)
  // is derived from this same angle so the streak always points the way
  // it's actually travelling.
  const angle = 10 + Math.random() * 16 // 10°-26° below horizontal
  return {
    id,
    top: Math.random() * 45,
    left: Math.random() * 55 + 5,
    delay: id * 4.5 + Math.random() * 5,
    duration: 2.6 + Math.random() * 1.6,
    angle,
    distance: 420 + Math.random() * 260,
    length: 90 + Math.random() * 60,
  }
}

export function Starfield() {
  const stars = useRef<Star[]>(
    Array.from({ length: 150 }).map((_, i) => {
      const bright = i % 9 === 0
      return {
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: bright ? Math.random() * 1 + 1.8 : Math.random() * 1.6 + 0.5,
        delay: Math.random() * 6,
        dur: Math.random() * 3 + 2.5,
        bright,
      }
    }),
  ).current

  const shootingStars = useRef<ShootingStar[]>(
    Array.from({ length: 5 }).map((_, i) => makeShootingStar(i)),
  ).current

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 20% 10%, rgba(139,111,232,0.18), transparent 60%), ' +
            'radial-gradient(ellipse 70% 50% at 85% 30%, rgba(79,216,196,0.12), transparent 60%), ' +
            'radial-gradient(ellipse 90% 70% at 50% 100%, rgba(232,143,209,0.12), transparent 60%), ' +
            'radial-gradient(ellipse 55% 40% at 65% 65%, rgba(245,200,107,0.06), transparent 65%), ' +
            '#060714',
        }}
      />
      {/* Faint Milky Way band for extra depth */}
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background:
            'linear-gradient(115deg, transparent 30%, rgba(201,194,240,0.05) 46%, rgba(237,235,255,0.08) 50%, rgba(201,194,240,0.05) 54%, transparent 70%)',
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
            boxShadow: s.bright ? '0 0 6px 1px rgba(237,235,255,0.55)' : undefined,
            animation: `giga-twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
      {shootingStars.map((s) => {
        const angleRad = (s.angle * Math.PI) / 180
        const dx = Math.round(s.distance * Math.cos(angleRad))
        const dy = Math.round(s.distance * Math.sin(angleRad))
        return (
          <div
            key={s.id}
            className="absolute motion-reduce:hidden"
            style={
              {
                top: `${s.top}%`,
                left: `${s.left}%`,
                width: 1,
                height: 1,
                animation: `giga-shoot ${s.duration}s ease-out ${s.delay}s infinite`,
                '--dx': `${dx}px`,
                '--dy': `${dy}px`,
              } as CSSProperties
            }
          >
            <div
              style={{
                width: s.length,
                height: 2,
                borderRadius: 2,
                transform: `rotate(${s.angle}deg)`,
                transformOrigin: 'left center',
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(245,200,107,0.55) 65%, #FFFCF2 100%)',
              }}
            />
          </div>
        )
      })}
    </div>
  )
}
