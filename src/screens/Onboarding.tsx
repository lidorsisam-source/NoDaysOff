import { useState } from 'react'
import type { CoachStyle, Goal, Profile } from '../types'
import { useI18n } from '../i18n/useI18n'
import { Button } from '../components/ui/Button'
import { BrandMark } from '../components/Layout'

interface Draft {
  name: string
  age: string
  heightCm: string
  weightKg: string
  goal: Goal | null
  workoutsPerWeek: number
  coachStyle: CoachStyle | null
}

const EMPTY: Draft = {
  name: '',
  age: '',
  heightCm: '',
  weightKg: '',
  goal: null,
  workoutsPerWeek: 4,
  coachStyle: null,
}

export function Onboarding({ onComplete }: { onComplete: (p: Profile) => void }) {
  const { t } = useI18n()
  const [step, setStep] = useState(0)
  const [d, setD] = useState<Draft>(EMPTY)
  const STEPS = 5

  const goals: { key: Goal; label: string; icon: string }[] = [
    { key: 'lose-weight', label: t.goalLose, icon: '🔥' },
    { key: 'build-muscle', label: t.goalBuild, icon: '💪' },
    { key: 'maintain', label: t.goalMaintain, icon: '⚖️' },
  ]
  const coaches: { key: CoachStyle; label: string; desc: string; icon: string }[] = [
    { key: 'beast', label: t.coachBeast, desc: t.coachBeastDesc, icon: '🔥' },
    { key: 'supportive', label: t.coachSupportive, desc: t.coachSupportiveDesc, icon: '💚' },
    { key: 'tough-love', label: t.coachTough, desc: t.coachToughDesc, icon: '😏' },
  ]

  const canNext = [
    d.name.trim().length > 0,
    !!(d.age && d.heightCm && d.weightKg),
    !!d.goal,
    d.workoutsPerWeek >= 1,
    !!d.coachStyle,
  ][step]

  function next() {
    if (step < STEPS - 1) return setStep(step + 1)
    onComplete({
      name: d.name.trim(),
      age: Number(d.age),
      heightCm: Number(d.heightCm),
      weightKg: Number(d.weightKg),
      goal: d.goal!,
      workoutsPerWeek: d.workoutsPerWeek,
      coachStyle: d.coachStyle!,
    })
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pb-8 pt-8">
      {/* Progress dots + brand */}
      <div className="flex items-center justify-between">
        <BrandMark className="h-7" />
        <div className="flex gap-1.5">
          {Array.from({ length: STEPS }, (_, i) => (
            <span
              key={i}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === step ? 22 : 8,
                background: i <= step ? 'var(--color-orange)' : 'var(--color-line-2)',
              }}
            />
          ))}
        </div>
      </div>

      <div key={step} className="anim-rise mt-10 flex-1">
        {step === 0 && (
          <Field title={t.obNameTitle} sub={t.obNameSub}>
            <input
              autoFocus
              value={d.name}
              onChange={(e) => setD({ ...d, name: e.target.value })}
              placeholder={t.obNamePlaceholder}
              className="h-16 w-full rounded-2xl border border-[var(--color-line-2)] bg-[var(--color-surface)] px-5 text-xl font-bold text-white placeholder:text-[var(--color-ink-3)] focus:border-[var(--color-orange)] focus:outline-none"
            />
          </Field>
        )}

        {step === 1 && (
          <Field title={t.obBodyTitle} sub={t.obBodySub}>
            <div className="flex flex-col gap-3">
              <NumberInput label={t.obAge} value={d.age} onChange={(v) => setD({ ...d, age: v })} />
              <NumberInput label={t.obHeight} value={d.heightCm} onChange={(v) => setD({ ...d, heightCm: v })} />
              <NumberInput label={t.obWeight} value={d.weightKg} onChange={(v) => setD({ ...d, weightKg: v })} />
            </div>
          </Field>
        )}

        {step === 2 && (
          <Field title={t.obGoalTitle} sub={t.obGoalSub}>
            <div className="flex flex-col gap-3">
              {goals.map((g) => (
                <SelectCard
                  key={g.key}
                  icon={g.icon}
                  title={g.label}
                  selected={d.goal === g.key}
                  onClick={() => setD({ ...d, goal: g.key })}
                />
              ))}
            </div>
          </Field>
        )}

        {step === 3 && (
          <Field title={t.obFreqTitle} sub={t.obFreqSub}>
            <div className="flex flex-col items-center gap-6 pt-4">
              <span className="ltr tabular font-display text-7xl text-[var(--color-orange)]">
                {d.workoutsPerWeek}
              </span>
              <span className="text-sm text-[var(--color-ink-2)]">{t.obFreqUnit}</span>
              <input
                type="range"
                min={1}
                max={7}
                value={d.workoutsPerWeek}
                onChange={(e) => setD({ ...d, workoutsPerWeek: Number(e.target.value) })}
                className="ltr h-2 w-full accent-[var(--color-orange)]"
                aria-label={t.obFreqUnit}
              />
              <div className="ltr flex w-full justify-between px-1 text-xs text-[var(--color-ink-3)]">
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <span key={n}>{n}</span>
                ))}
              </div>
            </div>
          </Field>
        )}

        {step === 4 && (
          <Field title={t.obCoachTitle} sub={t.obCoachSub}>
            <div className="flex flex-col gap-3">
              {coaches.map((c) => (
                <SelectCard
                  key={c.key}
                  icon={c.icon}
                  title={c.label}
                  desc={c.desc}
                  selected={d.coachStyle === c.key}
                  onClick={() => setD({ ...d, coachStyle: c.key })}
                />
              ))}
            </div>
          </Field>
        )}
      </div>

      <div className="flex gap-3 pt-6">
        {step > 0 && (
          <Button variant="ghost" onClick={() => setStep(step - 1)}>
            {t.obBack}
          </Button>
        )}
        <Button fullWidth disabled={!canNext} onClick={next}>
          {step === STEPS - 1 ? t.obFinish : t.obNext}
        </Button>
      </div>
    </div>
  )
}

function Field({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div>
      <h1 className="font-display text-3xl text-white">{title}</h1>
      <p className="mt-2 text-sm text-[var(--color-ink-2)]">{sub}</p>
      <div className="mt-7">{children}</div>
    </div>
  )
}

function NumberInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--color-line-2)] bg-[var(--color-surface)] px-5 py-3">
      <span className="text-[var(--color-ink-2)]">{label}</span>
      <input
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ''))}
        className="ltr tabular w-24 bg-transparent text-end text-2xl font-bold text-white focus:outline-none"
        placeholder="0"
      />
    </label>
  )
}

function SelectCard({
  icon,
  title,
  desc,
  selected,
  onClick,
}: {
  icon: string
  title: string
  desc?: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      className="pressable flex items-center gap-4 rounded-2xl border p-4 text-start transition-colors"
      style={{
        borderColor: selected ? 'var(--color-orange)' : 'var(--color-line-2)',
        background: selected ? 'rgba(255,106,0,0.1)' : 'var(--color-surface)',
      }}
    >
      <span className="text-3xl" aria-hidden>
        {icon}
      </span>
      <span className="flex-1">
        <span className="font-display block text-lg text-white">{title}</span>
        {desc && <span className="block text-sm text-[var(--color-ink-2)]">{desc}</span>}
      </span>
      <span
        className="flex h-6 w-6 items-center justify-center rounded-full border-2 text-sm"
        style={{
          borderColor: selected ? 'var(--color-orange)' : 'var(--color-line-2)',
          background: selected ? 'var(--color-orange)' : 'transparent',
          color: selected ? '#000' : 'transparent',
        }}
        aria-hidden
      >
        ✓
      </span>
    </button>
  )
}
