import { useStore, useTodaysMission } from '../store/appStore'
import { useI18n } from '../i18n/useI18n'
import { BrandMark } from '../components/Layout'
import { Flame } from '../components/Flame'
import { Shield } from '../components/Shield'
import { CoachCard } from '../components/CoachCard'
import { MissionCard } from '../components/MissionCard'
import { MissionComplete } from './MissionComplete'

export function Home() {
  const { t } = useI18n()
  const streak = useStore((s) => s.streak)
  const shields = useStore((s) => s.shields)
  const coachLog = useStore((s) => s.coachLog)
  const profile = useStore((s) => s.profile)
  const completeWorkout = useStore((s) => s.completeWorkout)
  const logCalories = useStore((s) => s.logCalories)
  const celebrating = useStore((s) => s.celebrating)

  const mission = useTodaysMission()
  const latestCoach = coachLog[0]

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <header className="flex items-center justify-between px-5 pb-2 pt-5">
        <BrandMark className="h-8" />
        <span className="text-sm text-[var(--color-ink-2)]">
          {profile?.name}
        </span>
      </header>

      <main className="flex-1 px-5 pb-32">
        {/* 1. Flame / streak — top of the hierarchy */}
        <div className="flex flex-col items-center pt-2 pb-4">
          <Flame streak={streak} label={t.dayStreak} />
        </div>

        {/* 2. Coach message — always visible */}
        {latestCoach && (
          <div className="mb-4">
            <CoachCard
              message={latestCoach.message}
              coachLabel={t.coachTitle}
              revealKey={latestCoach.date}
            />
          </div>
        )}

        {/* 3 + 4. Today's mission + complete action */}
        <MissionCard
          t={t}
          dayType={mission.dayType}
          completed={mission.completed}
          outcome={mission.outcome}
          calorieTarget={mission.calorieTarget}
          caloriesLogged={mission.caloriesLogged}
          onCompleteWorkout={completeWorkout}
          onLogCalories={logCalories}
        />

        {/* 5. Shield status */}
        <div className="mt-4 flex items-center justify-between rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-4 shadow-[var(--shadow-card)]">
          <div>
            <span className="font-display text-xs tracking-[0.2em] text-[var(--color-ink-3)]">
              {t.shieldStatus}
            </span>
            <p className="text-sm text-white">
              {shields >= 4 ? t.shieldReady : `${shields} ${t.shieldOf} 4`}
            </p>
          </div>
          <Shield shields={shields} />
        </div>
      </main>

      {celebrating && <MissionComplete />}
    </div>
  )
}
