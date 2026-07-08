import { useStore } from '../store/appStore'
import { useI18n } from '../i18n/useI18n'
import { Screen } from '../components/Layout'
import { EmptyState } from '../components/ui/states'
import { brand } from '../brand/assets'

/** Relative "time ago" using only the active language, numbers stay LTR. */
function timeAgo(iso: string, lang: 'he' | 'en'): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  const hrs = Math.floor(mins / 60)
  const days = Math.floor(hrs / 24)
  if (lang === 'he') {
    if (days > 0) return `לפני ${days} ימים`
    if (hrs > 0) return `לפני ${hrs} שעות`
    if (mins > 0) return `לפני ${mins} דק'`
    return 'עכשיו'
  }
  if (days > 0) return `${days}d ago`
  if (hrs > 0) return `${hrs}h ago`
  if (mins > 0) return `${mins}m ago`
  return 'now'
}

export function Coach() {
  const { t, lang } = useI18n()
  const coachLog = useStore((s) => s.coachLog)

  return (
    <Screen title={t.coachTitle}>
      {/* Coach presence hero */}
      <div className="relative mb-5 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(130% 90% at 100% 0, rgba(255,106,0,0.16), transparent 55%)' }}
        />
        <div className="relative flex items-center gap-4 p-4">
          <div className="h-28 w-24 shrink-0 overflow-hidden rounded-2xl bg-black ring-1 ring-[var(--color-line-2)]">
            <img
              src={brand.coach}
              alt=""
              aria-hidden
              className="h-full w-full scale-110 object-cover object-top"
              style={{ objectPosition: '50% 10%' }}
            />
          </div>
          <div>
            <span className="font-display text-xs tracking-[0.22em] text-[var(--color-orange)]">
              {t.coachTitle}
            </span>
            <p className="mt-1 text-sm text-[var(--color-ink-2)]">{t.coachFeedSub}</p>
          </div>
        </div>
      </div>

      {coachLog.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-surface)]">
          <EmptyState icon="🥊" title={t.coachTitle} body={t.coachEmpty} />
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {coachLog.map((entry, i) => (
            <li
              key={i}
              className="anim-rise rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]"
            >
              <p className="text-[15px] font-medium leading-snug text-white">{entry.message}</p>
              <span className="ltr mt-2 block text-xs text-[var(--color-ink-3)]">
                {timeAgo(entry.date, lang)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Screen>
  )
}
