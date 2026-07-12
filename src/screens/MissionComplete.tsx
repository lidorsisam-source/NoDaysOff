import { useStore } from '../store/appStore'
import { useI18n } from '../i18n/useI18n'
import { brand } from '../brand/assets'
import { Button } from '../components/ui/Button'
import { useCountUp } from '../lib/useCountUp'

/** Full-screen celebration moment shown right after a mission is completed. */
export function MissionComplete() {
  const { t } = useI18n()
  const streak = useStore((s) => s.streak)
  const dismiss = useStore((s) => s.dismissCelebration)
  const shownStreak = useCountUp(streak, 900)

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 px-8 text-center"
      role="dialog"
      aria-modal="true"
      aria-label={t.mcTitle}
    >
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />
      {/* orange flash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(circle at 50% 40%, rgba(255,106,0,0.35), transparent 60%)', animation: 'mission-flash 1s ease-out' }}
      />
      <div className="anim-pop relative flex flex-col items-center gap-5">
        {/* The flame spins in place like a slowly turning planet */}
        <div className="relative" style={{ perspective: '700px' }}>
          <div
            aria-hidden
            className="absolute inset-0 rounded-full blur-2xl"
            style={{ background: 'radial-gradient(circle, rgba(255,106,0,0.6), transparent 65%)' }}
          />
          <img
            src={brand.flame}
            alt=""
            aria-hidden
            className="anim-planet relative h-40 w-40 object-contain"
            style={{ transformStyle: 'preserve-3d', filter: 'drop-shadow(0 0 22px rgba(255,150,50,0.75))' }}
          />
        </div>
        <h1 className="font-display text-4xl text-white">{t.mcTitle}</h1>
        <p className="text-[var(--color-ink-2)]">{t.missionDoneSub}</p>
        <div className="flex items-baseline gap-2">
          <span className="ltr tabular font-display text-6xl text-[var(--color-orange)]">{shownStreak}</span>
          <span className="font-display text-lg tracking-[0.2em] text-[var(--color-ink-2)]">{t.dayStreak}</span>
        </div>
      </div>
      <div className="relative w-full max-w-xs">
        <Button fullWidth onClick={dismiss}>
          {t.mcClose}
        </Button>
      </div>
    </div>
  )
}
