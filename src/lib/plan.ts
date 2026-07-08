import type { DayType, Profile, WeeklyPlan } from '../types'

/**
 * Spread `count` workout days evenly across a 7-day week (Bresenham-style
 * distribution), e.g. 3/week -> Tue/Thu/Sat, 5/week -> every day but two.
 */
function spreadWorkoutDays(count: number): DayType[] {
  const clamped = Math.max(0, Math.min(7, count))
  const days: DayType[] = new Array(7).fill('rest')
  for (let i = 0; i < 7; i++) {
    const prev = Math.floor((i * clamped) / 7)
    const curr = Math.floor(((i + 1) * clamped) / 7)
    if (curr > prev) days[i] = 'workout'
  }
  return days
}

function activityFactor(workoutsPerWeek: number): number {
  if (workoutsPerWeek <= 1) return 1.2
  if (workoutsPerWeek <= 3) return 1.375
  if (workoutsPerWeek <= 5) return 1.55
  return 1.725
}

function goalAdjustment(goal: Profile['goal']): number {
  switch (goal) {
    case 'lose-weight':
      return -500
    case 'build-muscle':
      return 300
    case 'maintain':
      return 0
  }
}

/** Mifflin-St Jeor BMR, gender-neutral (average of the male/female offsets) since we don't collect gender. */
function estimateBmr(profile: Profile): number {
  return 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age - 78
}

export function calculateCalorieTarget(profile: Profile): number {
  const bmr = estimateBmr(profile)
  const tdee = bmr * activityFactor(profile.workoutsPerWeek)
  const target = tdee + goalAdjustment(profile.goal)
  return Math.max(1200, Math.round(target / 10) * 10)
}

export function generatePlan(profile: Profile): WeeklyPlan {
  return {
    days: spreadWorkoutDays(profile.workoutsPerWeek),
    calorieTarget: calculateCalorieTarget(profile),
  }
}

const CALORIE_OVERAGE_TOLERANCE = 1.1

/** Logging above 110% of the calorie target counts as an overage (half shield penalty). */
export function isCalorieOverage(loggedCalories: number, target: number): boolean {
  return loggedCalories > target * CALORIE_OVERAGE_TOLERANCE
}
