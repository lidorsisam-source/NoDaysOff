interface Props {
  shields: number // 0..4, half steps allowed
  max?: number
  label?: string
  cracking?: boolean
}

/** A single steel shield pip: full, half (vertically split), or empty/cracked. */
function Pip({ fill, cracking }: { fill: 0 | 0.5 | 1; cracking?: boolean }) {
  const steel = 'var(--color-steel)'
  const id = `half-${Math.random().toString(36).slice(2, 8)}`
  return (
    <svg
      viewBox="0 0 24 28"
      className={`h-7 w-6 ${cracking && fill === 0 ? 'anim-crack' : ''}`}
      role="img"
    >
      <defs>
        <linearGradient id={id} x1="0" x2="1" y1="0" y2="0">
          <stop offset="50%" stopColor={steel} />
          <stop offset="50%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <path
        d="M12 1 L22 5 V13 C22 20 17 25 12 27 C7 25 2 20 2 13 V5 Z"
        fill={fill === 1 ? steel : fill === 0.5 ? `url(#${id})` : 'transparent'}
        fillOpacity={fill === 0 ? 0 : 0.9}
        stroke={fill === 0 ? 'rgba(184,189,199,0.32)' : 'rgba(255,255,255,0.5)'}
        strokeWidth="1.4"
        strokeDasharray={fill === 0 ? '3 2' : undefined}
      />
      {fill > 0 && (
        <path
          d="M12 1 L22 5 V13 C22 20 17 25 12 27"
          fill="none"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="1"
        />
      )}
    </svg>
  )
}

export function Shield({ shields, max = 4, label, cracking }: Props) {
  const pips = Array.from({ length: max }, (_, i) => {
    const v = shields - i
    return (v >= 1 ? 1 : v >= 0.5 ? 0.5 : 0) as 0 | 0.5 | 1
  })
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5" role="group" aria-label={label}>
        {pips.map((fill, i) => (
          <Pip key={i} fill={fill} cracking={cracking} />
        ))}
      </div>
      {label && (
        <span className="text-sm text-[var(--color-ink-2)]">
          {label} <span className="ltr tabular text-white">{shields}</span>
          <span className="text-[var(--color-ink-3)]">/{max}</span>
        </span>
      )}
    </div>
  )
}
