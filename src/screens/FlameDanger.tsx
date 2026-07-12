import { useMemo } from 'react'
import { useStore } from '../store/appStore'
import { useI18n } from '../i18n/useI18n'
import { brand } from '../brand/assets'
import { Button } from '../components/ui/Button'
import { COACH_PHRASES } from '../lib/coachPhrases'

/** Water streams pouring down onto the flame. Fixed configs — no reshuffle on render. */
const STREAMS = [
  { left: '30%', dur: '1.3s', delay: '0s', h: 74, w: 4 },
  { left: '42%', dur: '1.6s', delay: '0.45s', h: 92, w: 5 },
  { left: '54%', dur: '1.2s', delay: '0.9s', h: 68, w: 4 },
  { left: '64%', dur: '1.5s', delay: '0.25s', h: 84, w: 5 },
  { left: '74%', dur: '1.35s', delay: '0.7s', h: 60, w: 3 },
]

const PUFFS = [
  { left: '28%', x: '-12px', dur: '2.2s', delay: '0.2s', size: 26 },
  { left: '48%', x: '6px', dur: '2.6s', delay: '1.1s', size: 34 },
  { left: '66%', x: '14px', dur: '2.4s', delay: '0.6s', size: 28 },
]

/** English urgency lines (the Hebrew ones come from the coach's signature bank). */
const EN_LATE_LINES = [
  'The clock keeps moving. The excuse stays the same.',
  "The day is almost over. Don't let it end without a check-in.",
  'The mission is still waiting. It has more patience than I do.',
]

/**
 * Evening takeover: the mission is still open after 18:00 and the flame is
 * being doused — water pours on it, it gutters, steam rises. One job: get the
 * user to act before the day ends.
 */
export function FlameDanger() {
  const { t, lang } = useI18n()
  const streak = useStore((s) => s.streak)
  const dismiss = useStore((s) => s.dismissDanger)

  const coachLine = useMemo(() => {
    const pool = lang === 'he' ? COACH_PHRASES.lateHour : EN_LATE_LINES
    return pool[Math.floor(Math.random() * pool.length)]
  }, [lang])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 px-8 text-center"
      role="alertdialog"
      aria-modal="true"
      aria-label={t.dangerTitle}
    >
      {/* Cold, wet backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(circle at 50% 30%, rgba(70,110,170,0.22), transparent 60%)' }}
      />

      <div className="anim-pop relative flex flex-col items-center gap-5">
        {/* Flame under attack */}
        <div className="relative h-56 w-56">
          {/* water streams */}
          <div aria-hidden className="absolute inset-x-0 -top-2 bottom-10 overflow-hidden">
            {STREAMS.map((s, i) => (
              <span
                key={i}
                className="anim-water absolute top-0 rounded-full"
                style={{
                  left: s.left,
                  width: s.w,
                  height: s.h,
                  background: 'linear-gradient(to bottom, rgba(120,180,255,0), rgba(140,195,255,0.9), rgba(90,150,230,0.7))',
                  boxShadow: '0 0 8px rgba(120,180,255,0.5)',
                  ['--water-dur' as string]: s.dur,
                  ['--water-delay' as string]: s.delay,
                }}
              />
            ))}
          </div>
          {/* guttering flame */}
          <img
            src={brand.flame}
            alt=""
            aria-hidden
            className="anim-danger absolute inset-0 m-auto h-44 w-44 object-contain"
          />
          {/* steam where water meets fire */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            {PUFFS.map((p, i) => (
              <span
                key={i}
                className="anim-steam absolute rounded-full blur-md"
                style={{
                  left: p.left,
                  top: '30%',
                  width: p.size,
                  height: p.size,
                  background: 'rgba(190,205,220,0.4)',
                  ['--steam-x' as string]: p.x,
                  ['--steam-dur' as string]: p.dur,
                  ['--steam-delay' as string]: p.delay,
                }}
              />
            ))}
          </div>
        </div>

        <h1 className="font-display text-4xl text-white">{t.dangerTitle}</h1>
        <p className="max-w-xs text-[var(--color-ink-2)]">{t.dangerSub}</p>

        {streak > 0 && (
          <div className="flex items-baseline gap-2">
            <span className="ltr tabular font-display text-5xl text-[var(--color-flame)]">{streak}</span>
            <span className="font-display text-base tracking-[0.2em] text-[var(--color-ink-2)]">
              {t.dayStreak}
            </span>
          </div>
        )}

        {/* The coach weighs in */}
        <p className="max-w-xs rounded-2xl border border-[var(--color-line-2)] bg-[var(--color-surface)] px-4 py-3 text-sm font-medium text-white">
          "{coachLine}"
        </p>
      </div>

      <div className="relative w-full max-w-xs">
        <Button fullWidth onClick={dismiss}>
          {t.dangerCta}
        </Button>
      </div>
    </div>
  )
}
