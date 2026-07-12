import { CoachPortrait } from './CoachPortrait'

interface Props {
  message: string
  coachLabel: string
  /** Changing this key replays the reveal animation. */
  revealKey?: string | number
}

/**
 * The coach addresses the user directly. This is NOT a chat surface — it shows
 * one behavior-triggered line at a time, delivered with the coach's portrait.
 */
export function CoachCard({ message, coachLabel, revealKey }: Props) {
  return (
    <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(120% 100% at 100% 0, rgba(255,106,0,0.12), transparent 55%)' }}
      />
      <div className="relative flex items-stretch gap-3 p-3">
        <CoachPortrait
          live
          shade
          className="h-24 w-20 shrink-0 rounded-2xl"
          mediaClassName="scale-125"
          position="50% 12%"
        />
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
          <span className="font-display text-xs tracking-[0.22em] text-[var(--color-orange)]">
            {coachLabel}
          </span>
          <p key={revealKey} className="anim-rise text-[15px] font-medium leading-snug text-white">
            {message}
          </p>
        </div>
      </div>
    </div>
  )
}
