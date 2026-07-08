import { brand } from '../brand/assets'

interface Props {
  streak: number
  label: string
  /** Big hero flame (Home) vs. compact inline flame. */
  size?: 'hero' | 'sm'
}

/**
 * The flame mark represents the live streak. It breathes when lit (streak > 0)
 * and dims to a cold ember when the streak is extinguished.
 */
export function Flame({ streak, label, size = 'hero' }: Props) {
  const lit = streak > 0
  const dim = size === 'hero' ? 168 : 44

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center" style={{ width: dim, height: dim }}>
        {lit && size === 'hero' && (
          <div
            aria-hidden
            className="absolute inset-0 rounded-full blur-2xl"
            style={{ background: 'radial-gradient(circle, rgba(255,106,0,0.45), transparent 65%)' }}
          />
        )}
        <img
          src={brand.flame}
          alt=""
          aria-hidden
          className={`relative h-full w-full object-contain ${lit ? 'anim-flame' : ''}`}
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
        <span className="mt-1 font-display text-sm tracking-[0.2em] text-[var(--color-ink-2)]">
          {label}
        </span>
      ) : (
        <span className="ltr tabular mt-0.5 text-sm font-bold text-white">{streak}</span>
      )}
    </div>
  )
}
