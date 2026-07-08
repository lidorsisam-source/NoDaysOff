import { useCountUp } from '../lib/useCountUp'

interface Props {
  value: number
  label: string
  suffix?: string
  accent?: 'orange' | 'flame' | 'steel' | 'success'
}

const accents = {
  orange: 'var(--color-orange)',
  flame: 'var(--color-flame)',
  steel: 'var(--color-steel)',
  success: 'var(--color-success)',
}

export function ProgressCard({ value, label, suffix, accent = 'orange' }: Props) {
  const shown = useCountUp(value)
  return (
    <div className="flex flex-col gap-1 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
      <span
        className="ltr tabular font-display text-4xl leading-none"
        style={{ color: accents[accent] }}
      >
        {shown}
        {suffix && <span className="text-xl text-[var(--color-ink-2)]"> {suffix}</span>}
      </span>
      <span className="text-xs text-[var(--color-ink-2)]">{label}</span>
    </div>
  )
}
