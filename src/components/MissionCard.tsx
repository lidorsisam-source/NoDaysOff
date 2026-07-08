import { useState } from 'react'
import type { Dict } from '../i18n/strings'
import { Button } from './ui/Button'

interface Props {
  t: Dict
  dayType: 'workout' | 'rest'
  completed: boolean
  outcome: 'success' | 'missed' | 'overage' | 'pending'
  calorieTarget: number
  caloriesLogged?: number
  onCompleteWorkout: () => void
  onLogCalories: (amount: number) => void
}

/** Circular progress ring (0..1). */
function Ring({ progress, children }: { progress: number; children: React.ReactNode }) {
  const r = 46
  const c = 2 * Math.PI * r
  const off = c * (1 - Math.min(1, Math.max(0, progress)))
  return (
    <div className="relative h-28 w-28">
      <svg viewBox="0 0 108 108" className="h-full w-full -rotate-90">
        <circle cx="54" cy="54" r={r} fill="none" stroke="var(--color-line-2)" strokeWidth="8" />
        <circle
          cx="54"
          cy="54"
          r={r}
          fill="none"
          stroke="var(--color-orange)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          style={{ transition: 'stroke-dashoffset 0.7s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  )
}

export function MissionCard({
  t,
  dayType,
  completed,
  outcome,
  calorieTarget,
  caloriesLogged,
  onCompleteWorkout,
  onLogCalories,
}: Props) {
  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)

  const isWorkout = dayType === 'workout'
  const title = isWorkout ? t.missionWorkout : t.missionRest
  const sub = isWorkout ? t.missionWorkoutSub : t.missionRestSub

  const ringProgress = completed
    ? 1
    : !isWorkout && value
      ? Math.min(1, Number(value) / calorieTarget)
      : 0

  function submitCalories() {
    const amount = Number(value)
    if (!amount || amount <= 0) return
    setSaving(true)
    // brief lock so the CTA can't double-fire
    setTimeout(() => {
      onLogCalories(amount)
      setSaving(false)
    }, 300)
  }

  return (
    <section
      className="relative overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-gradient-to-b from-[var(--color-surface-2)] to-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]"
      aria-label={t.todayMission}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 end-0 h-40 w-40 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(255,106,0,0.16), transparent 70%)' }}
      />
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1">
          <span className="font-display text-xs tracking-[0.22em] text-[var(--color-ink-3)]">
            {t.todayMission}
          </span>
          <h2 className="font-display mt-1 text-2xl text-white">{title}</h2>
          <p className="mt-1 text-sm text-[var(--color-ink-2)]">{sub}</p>
        </div>
        <Ring progress={ringProgress}>
          {completed ? (
            <span className="text-3xl text-[var(--color-success)]" aria-hidden>
              ✓
            </span>
          ) : isWorkout ? (
            <span className="font-display text-lg text-[var(--color-ink-2)]">GO</span>
          ) : (
            <>
              <span className="ltr tabular text-lg font-bold text-white">
                {value || 0}
              </span>
              <span className="ltr tabular text-[11px] text-[var(--color-ink-3)]">
                / {calorieTarget}
              </span>
            </>
          )}
        </Ring>
      </div>

      <div className="relative mt-5">
        {completed ? (
          <div className="flex items-center gap-3 rounded-2xl border border-[rgba(34,199,169,0.3)] bg-[rgba(34,199,169,0.08)] px-4 py-3">
            <span className="text-xl text-[var(--color-success)]" aria-hidden>
              ✓
            </span>
            <div>
              <p className="font-display text-sm text-[var(--color-success)]">{t.missionDone}</p>
              <p className="text-xs text-[var(--color-ink-2)]">
                {outcome === 'overage' && !isWorkout
                  ? `${caloriesLogged} ${t.calorieUnit} · ${t.outcomeOverage}`
                  : !isWorkout && caloriesLogged
                    ? `${caloriesLogged} / ${calorieTarget} ${t.calorieUnit}`
                    : t.missionDoneSub}
              </p>
            </div>
          </div>
        ) : isWorkout ? (
          <Button fullWidth onClick={onCompleteWorkout}>
            {t.completeWorkout}
          </Button>
        ) : (
          <div className="flex flex-col gap-3">
            <label className="sr-only" htmlFor="cal">
              {t.caloriesPlaceholder}
            </label>
            <input
              id="cal"
              inputMode="numeric"
              pattern="[0-9]*"
              value={value}
              onChange={(e) => setValue(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder={t.caloriesPlaceholder}
              className="ltr h-14 w-full rounded-2xl border border-[var(--color-line-2)] bg-[var(--color-bg-2)] px-4 text-center text-lg font-bold text-white placeholder:text-[var(--color-ink-3)] focus:border-[var(--color-orange)] focus:outline-none"
            />
            <Button fullWidth loading={saving} disabled={!value} onClick={submitCalories}>
              {t.save}
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
