import type { DayRecord, DayOutcome } from '../types'
import { toDateKey } from '../lib/streak'

interface Props {
  history: DayRecord[]
  weekDays: string[]
  label: string
}

const outcomeColor: Record<DayOutcome, string> = {
  success: 'var(--color-success)',
  overage: 'var(--color-flame)',
  missed: 'var(--color-danger)',
  pending: 'var(--color-line-2)',
}

/** Last 7 days as bars, colored by outcome. Sun-first alignment. */
export function WeeklyChart({ history, weekDays, label }: Props) {
  const byDate = new Map(history.map((r) => [r.date, r]))
  const today = new Date()

  // Build the current week Sun..Sat
  const sunday = new Date(today)
  sunday.setUTCDate(today.getUTCDate() - today.getUTCDay())

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday)
    d.setUTCDate(sunday.getUTCDate() + i)
    const key = toDateKey(d)
    const rec = byDate.get(key)
    const isFuture = key > toDateKey(today)
    const isToday = key === toDateKey(today)
    return { label: weekDays[i], outcome: (rec?.outcome ?? 'pending') as DayOutcome, isFuture, isToday }
  })

  return (
    <div>
      <span className="font-display text-xs tracking-[0.2em] text-[var(--color-ink-3)]">{label}</span>
      <div className="mt-3 flex items-end justify-between gap-2" role="img" aria-label={label}>
        {days.map((d, i) => {
          const filled = d.outcome !== 'pending'
          const height = filled ? (d.outcome === 'overage' ? 60 : 84) : 26
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-24 w-full items-end justify-center">
                <div
                  className="w-full max-w-9 rounded-lg transition-all"
                  style={{
                    height: `${d.isFuture ? 26 : height}%`,
                    background: d.isFuture ? 'var(--color-line)' : outcomeColor[d.outcome],
                    opacity: d.isFuture ? 0.4 : 1,
                    boxShadow: d.isToday ? '0 0 0 2px var(--color-orange)' : undefined,
                  }}
                />
              </div>
              <span
                className={`text-xs ${d.isToday ? 'font-bold text-white' : 'text-[var(--color-ink-3)]'}`}
              >
                {d.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
