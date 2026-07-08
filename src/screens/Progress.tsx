import { useStore } from '../store/appStore'
import { useI18n } from '../i18n/useI18n'
import { Screen } from '../components/Layout'
import { ProgressCard } from '../components/ProgressCard'
import { WeeklyChart } from '../components/WeeklyChart'
import { Shield } from '../components/Shield'
import { EmptyState } from '../components/ui/states'

export function Progress() {
  const { t } = useI18n()
  const streak = useStore((s) => s.streak)
  const longestStreak = useStore((s) => s.longestStreak)
  const shields = useStore((s) => s.shields)
  const history = useStore((s) => s.history)
  const shieldEvents = useStore((s) => s.shieldEvents)

  const completed = history.filter((r) => r.completed).length
  const completion = history.length ? Math.round((completed / history.length) * 100) : 0

  return (
    <Screen title={t.progressTitle}>
      <div className="grid grid-cols-2 gap-3">
        <ProgressCard value={streak} label={t.currentStreak} suffix={t.days} accent="orange" />
        <ProgressCard value={longestStreak} label={t.longestStreak} suffix={t.days} accent="flame" />
        <ProgressCard value={completion} label={t.completionRate} suffix="%" accent="success" />
        <div className="flex flex-col justify-between gap-2 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
          <span className="font-display text-xs tracking-[0.2em] text-[var(--color-ink-3)]">
            {t.shieldStatus}
          </span>
          <Shield shields={shields} />
        </div>
      </div>

      <div className="mt-4 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
        <WeeklyChart history={history} weekDays={t.weekDays} label={t.thisWeek} />
      </div>

      <div className="mt-4">
        <h2 className="font-display mb-3 text-sm tracking-[0.2em] text-[var(--color-ink-3)]">
          {t.shieldHistory}
        </h2>
        {shieldEvents.length === 0 ? (
          <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-surface)]">
            <EmptyState icon="🛡️" title={t.shieldHistory} body={t.noShieldEvents} />
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {[...shieldEvents].reverse().map((e, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3"
              >
                <span className="ltr text-sm text-[var(--color-ink-2)]">{e.date}</span>
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                  style={{
                    background: e.kind === 'full' ? 'rgba(255,77,77,0.14)' : 'rgba(255,194,71,0.14)',
                    color: e.kind === 'full' ? 'var(--color-danger)' : 'var(--color-flame)',
                  }}
                >
                  {e.kind === 'full' ? '−1' : '−½'} {t.shieldStatus}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Screen>
  )
}
