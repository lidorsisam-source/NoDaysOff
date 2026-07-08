export type CoachStyle = 'beast' | 'supportive' | 'tough-love'

export type Goal = 'lose-weight' | 'build-muscle' | 'maintain'

export type DayType = 'workout' | 'rest'

export type DayOutcome = 'success' | 'missed' | 'overage' | 'pending'

export interface Profile {
  name: string
  age: number
  heightCm: number
  weightKg: number
  goal: Goal
  workoutsPerWeek: number
  coachStyle: CoachStyle
}

export interface WeeklyPlan {
  /** index 0 = Sunday .. 6 = Saturday */
  days: DayType[]
  calorieTarget: number
}

export interface DayRecord {
  date: string // YYYY-MM-DD
  type: DayType
  completed: boolean
  caloriesLogged?: number
  outcome: DayOutcome
}

export interface ShieldEvent {
  date: string
  kind: 'full' | 'half'
  reason: string
}

export type CoachEvent =
  | 'app_open'
  | 'mission_complete'
  | 'full_penalty'
  | 'half_penalty'
  | 'new_streak'
  | 'new_month'
  | 'achievement'

export interface CoachLogEntry {
  date: string
  event: CoachEvent
  message: string
}

export type Lang = 'he' | 'en'

export interface AppState {
  onboarded: boolean
  profile: Profile | null
  plan: WeeklyPlan | null
  streak: number
  longestStreak: number
  shields: number
  shieldMonth: string // YYYY-MM the shields counter belongs to
  shieldEvents: ShieldEvent[]
  history: DayRecord[]
  lastCheckedDate: string | null
  coachLog: CoachLogEntry[]
  notificationsEnabled: boolean
  lang: Lang
}

export const INITIAL_STATE: AppState = {
  onboarded: false,
  profile: null,
  plan: null,
  streak: 0,
  longestStreak: 0,
  shields: 4,
  shieldMonth: '',
  shieldEvents: [],
  history: [],
  lastCheckedDate: null,
  coachLog: [],
  notificationsEnabled: false,
  lang: 'he',
}
