import { useStore } from '../store/appStore'
import { useI18n } from '../i18n/useI18n'
import { Screen } from '../components/Layout'
import { Button } from '../components/ui/Button'
import { brand } from '../brand/assets'
import type { CoachStyle, Goal } from '../types'

export function Profile() {
  const { t } = useI18n()
  const profile = useStore((s) => s.profile)
  const coachLog = useStore((s) => s.coachLog)
  const updateProfile = useStore((s) => s.updateProfile)
  const setCoachStyle = useStore((s) => s.setCoachStyle)
  const openSettings = useStore((s) => s.openSettings)
  const logout = useStore((s) => s.logout)

  if (!profile) return null

  const goals: { key: Goal; label: string }[] = [
    { key: 'lose-weight', label: t.goalLose },
    { key: 'build-muscle', label: t.goalBuild },
    { key: 'maintain', label: t.goalMaintain },
  ]
  const coaches: { key: CoachStyle; label: string; icon: string }[] = [
    { key: 'beast', label: t.coachBeast, icon: '🔥' },
    { key: 'supportive', label: t.coachSupportive, icon: '💚' },
    { key: 'tough-love', label: t.coachTough, icon: '😏' },
  ]
  const coachLabel = coaches.find((c) => c.key === profile.coachStyle)?.label

  return (
    <Screen
      title={t.profileTitle}
      right={
        <button
          onClick={openSettings}
          aria-label={t.settings}
          className="pressable flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-line-2)] bg-[var(--color-surface)]"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="3" />
            <path d="M19 12a7 7 0 0 0-.1-1l2-1.6-2-3.4-2.4 1a7 7 0 0 0-1.7-1L14.5 2h-4l-.3 2.6a7 7 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.6a7 7 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 1.7 1l.3 2.6h4l.3-2.6a7 7 0 0 0 1.7-1l2.4 1 2-3.4-2-1.6a7 7 0 0 0 .1-1z" />
          </svg>
        </button>
      }
    >
      {/* Coach presence */}
      <div className="relative mb-5 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
        <span className="font-display text-xs tracking-[0.2em] text-[var(--color-ink-3)]">
          {t.coachPresence}
        </span>
        <div className="mt-3 flex items-center gap-4">
          <div className="h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-black ring-1 ring-[var(--color-line-2)]">
            <img src={brand.coach} alt="" aria-hidden className="h-full w-full scale-110 object-cover object-top" style={{ objectPosition: '50% 10%' }} />
          </div>
          <div className="min-w-0">
            <p className="font-display text-lg text-white">{coachLabel}</p>
            {coachLog[0] && (
              <p className="truncate text-sm text-[var(--color-ink-2)]">"{coachLog[0].message}"</p>
            )}
          </div>
        </div>
      </div>

      {/* Details */}
      <Section title={t.editDetails}>
        <Row label={t.obNamePlaceholder}>
          <input
            value={profile.name}
            onChange={(e) => updateProfile({ name: e.target.value })}
            className="w-40 bg-transparent text-end font-bold text-white focus:outline-none"
          />
        </Row>
        <Row label={t.obAge}>
          <EditNum value={profile.age} onChange={(n) => updateProfile({ age: n })} />
        </Row>
        <Row label={t.obHeight}>
          <EditNum value={profile.heightCm} onChange={(n) => updateProfile({ heightCm: n })} />
        </Row>
        <Row label={t.obWeight}>
          <EditNum value={profile.weightKg} onChange={(n) => updateProfile({ weightKg: n })} />
        </Row>
        <Row label={t.obFreqUnit}>
          <EditNum value={profile.workoutsPerWeek} onChange={(n) => updateProfile({ workoutsPerWeek: Math.max(1, Math.min(7, n)) })} />
        </Row>
      </Section>

      {/* Goal */}
      <Section title={t.obGoalTitle}>
        <div className="flex gap-2">
          {goals.map((g) => (
            <Chip key={g.key} label={g.label} selected={profile.goal === g.key} onClick={() => updateProfile({ goal: g.key })} />
          ))}
        </div>
      </Section>

      {/* Coach style */}
      <Section title={t.changeCoach}>
        <div className="flex gap-2">
          {coaches.map((c) => (
            <Chip key={c.key} label={`${c.icon} ${c.label}`} selected={profile.coachStyle === c.key} onClick={() => setCoachStyle(c.key)} />
          ))}
        </div>
      </Section>

      <div className="mt-6">
        <Button variant="secondary" fullWidth onClick={logout}>
          {t.logout}
        </Button>
      </div>
    </Screen>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h2 className="font-display mb-3 text-sm tracking-[0.2em] text-[var(--color-ink-3)]">{title}</h2>
      <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-surface)]">
        {children}
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--color-line)] px-4 py-3 last:border-b-0">
      <span className="text-[var(--color-ink-2)]">{label}</span>
      {children}
    </div>
  )
}

function EditNum({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <input
      inputMode="numeric"
      pattern="[0-9]*"
      value={value}
      onChange={(e) => onChange(Number(e.target.value.replace(/[^0-9]/g, '')) || 0)}
      className="ltr tabular w-24 bg-transparent text-end font-bold text-white focus:outline-none"
    />
  )
}

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      className="pressable flex-1 rounded-2xl border px-3 py-3 text-sm font-semibold transition-colors"
      style={{
        borderColor: selected ? 'var(--color-orange)' : 'var(--color-line-2)',
        background: selected ? 'rgba(255,106,0,0.12)' : 'var(--color-surface)',
        color: selected ? '#fff' : 'var(--color-ink-2)',
      }}
    >
      {label}
    </button>
  )
}
