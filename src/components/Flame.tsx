import { brand } from '../brand/assets'

interface Props {
  streak: number
  label: string
  /** Big hero flame (Home) vs. compact inline flame. */
  size?: 'hero' | 'sm'
  /** Streak at risk (evening, mission still open): gutter instead of breathe. */
  danger?: boolean
}

/** Fixed ember paths so re-renders don't reshuffle the particles. */
const EMBERS = [
  { left: '22%', x: '-14px', dur: '2.4s', delay: '0s', size: 5 },
  { left: '38%', x: '8px', dur: '3.1s', delay: '0.6s', size: 4 },
  { left: '52%', x: '-6px', dur: '2.7s', delay: '1.3s', size: 6 },
  { left: '66%', x: '12px', dur: '3.4s', delay: '0.2s', size: 4 },
  { left: '78%', x: '-10px', dur: '2.9s', delay: '1.8s', size: 5 },
]

/**
 * The flame mark represents the live streak. It breathes when lit, gutters
 * with a cold cast when the streak is in danger, and dims to a cold ember
 * when the streak is extinguished.
 */
export function Flame({ streak, label, size = 'hero', danger = false }: Props) {
  const lit = streak > 0
  const dim = size === 'hero' ? 168 : 44

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center" style={{ width: dim, height: dim }}>
        {lit && size === 'hero' && (
          <div
            aria-hidden
            className="absolute inset-0 rounded-full blur-2xl"
            style={{
              background: danger
                ? 'radial-gradient(circle, rgba(120,150,200,0.25), transparent 65%)'
                : 'radial-gradient(circle, rgba(255,106,0,0.45), transparent 65%)',
            }}
          />
        )}
        {/* Ambient embers drifting off a healthy lit flame */}
        {lit && !danger && size === 'hero' && (
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-visible">
            {EMBERS.map((e, i) => (
              <span
                key={i}
                className="anim-ember absolute rounded-full"
                style={{
                  left: e.left,
                  bottom: '28%',
                  width: e.size,
                  height: e.size,
                  background: 'radial-gradient(circle, #ffc247, #ff6a00)',
                  boxShadow: '0 0 6px rgba(255,150,50,0.9)',
                  ['--ember-x' as string]: e.x,
                  ['--ember-dur' as string]: e.dur,
                  ['--ember-delay' as string]: e.delay,
                }}
              />
            ))}
          </div>
        )}
        <img
          src={brand.flame}
          alt=""
          aria-hidden
          className={`relative h-full w-full object-contain ${lit ? (danger ? 'anim-danger' : 'anim-flame') : ''}`}
          style={{
            filter: lit ? undefined : 'grayscale(0.85) brightness(0.5)',
            opacity: lit ? 1 : 0.6,
          }}
        />
        {size === 'hero' && (
          <div className="absolute inset-0 flex items-end justify-center pb-3">
            <span className="ltr tabular font-display text-5xl text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              {streak}
            </span>
          </div>
        )}
      </div>
      {size === 'hero' ? (
        <span
          className="mt-1 font-display text-sm tracking-[0.2em]"
          style={{ color: danger ? 'var(--color-flame)' : 'var(--color-ink-2)' }}
        >
          {label}
        </span>
      ) : (
        <span className="ltr tabular mt-0.5 text-sm font-bold text-white">{streak}</span>
      )}
    </div>
  )
}
