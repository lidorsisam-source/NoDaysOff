import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import type { AppState, CoachEvent, DayRecord, Lang, Profile } from '../types'
import { repository } from '../data/repository'
import { rollForward, toDateKey, STREAK_MILESTONES } from '../lib/streak'
import { generatePlan, isCalorieOverage } from '../lib/plan'
import { coachProvider } from '../lib/coachProvider'

export type Phase = 'splash' | 'onboarding' | 'notif' | 'main'
export type Tab = 'home' | 'progress' | 'coach' | 'profile'

/** Local hour after which an unfinished mission puts the flame "in danger". */
export const DANGER_HOUR = 18

interface UIState {
  phase: Phase
  tab: Tab
  /** Set right after a mission is completed to trigger the celebration overlay. */
  celebrating: boolean
  showSettings: boolean
  /** Evening "flame in danger" takeover (mission still open after 18:00). */
  dangerOpen: boolean
}

interface Actions {
  init: () => void
  dismissSplash: () => void
  completeOnboarding: (profile: Profile) => void
  finishNotifStep: () => void
  setTab: (tab: Tab) => void
  openSettings: () => void
  closeSettings: () => void
  completeWorkout: () => void
  logCalories: (amount: number) => void
  updateProfile: (patch: Partial<Profile>) => void
  setCoachStyle: (style: Profile['coachStyle']) => void
  setLang: (lang: Lang) => void
  toggleNotifications: (on: boolean) => void
  dismissCelebration: () => void
  openDanger: () => void
  dismissDanger: () => void
  logout: () => void
}

export type Store = AppState & UIState & Actions

/** Today's date key in the same (UTC) convention the streak engine uses. */
function today(): string {
  return toDateKey(new Date())
}

function todaysDayType(state: AppState): 'workout' | 'rest' {
  if (!state.plan) return 'rest'
  return state.plan.days[new Date().getUTCDay()]
}

/** The DayRecord for today, if one has been created. */
function todaysRecord(state: AppState): DayRecord | undefined {
  return state.history.find((r) => r.date === today())
}

export const useStore = create<Store>((set, get) => {
  /** Persist the domain slice of the store through the repository. */
  function persist() {
    const s = get()
    repository.saveState({
      onboarded: s.onboarded,
      profile: s.profile,
      plan: s.plan,
      streak: s.streak,
      longestStreak: s.longestStreak,
      shields: s.shields,
      shieldMonth: s.shieldMonth,
      shieldEvents: s.shieldEvents,
      history: s.history,
      lastCheckedDate: s.lastCheckedDate,
      coachLog: s.coachLog,
      notificationsEnabled: s.notificationsEnabled,
      lang: s.lang,
    })
  }

  /** Generate + record a coach message for an event and prepend it to the log. */
  function coach(event: CoachEvent) {
    const s = get()
    if (!s.profile) return
    const message = coachProvider.getMessage(event, s.profile.coachStyle, {
      name: s.profile.name,
      streak: s.streak,
      longestStreak: s.longestStreak,
      lang: s.lang,
      goal: s.profile.goal,
      dayType: todaysDayType(s),
    })
    const entry = { date: new Date().toISOString(), event, message }
    set({ coachLog: [entry, ...s.coachLog].slice(0, 30) })
  }

  return {
    ...repository.loadState(),
    phase: 'splash',
    tab: 'home',
    celebrating: false,
    showSettings: false,
    dangerOpen: false,

    init: () => {
      const loaded = repository.loadState()
      const { state } = rollForward(loaded, new Date())
      set(state)
      persist()
      // Fire an app_open coach line once per session if already onboarded.
      if (state.onboarded && state.profile) {
        coach('app_open')
      }
    },

    dismissSplash: () => {
      const s = get()
      set({ phase: s.onboarded ? 'main' : 'onboarding' })
      if (s.onboarded && s.profile && s.coachLog.length === 0) coach('app_open')
    },

    completeOnboarding: (profile) => {
      const plan = generatePlan(profile)
      set({
        profile,
        plan,
        onboarded: true,
        shieldMonth: new Date().toISOString().slice(0, 7),
        lastCheckedDate: today(),
        phase: 'notif',
      })
      persist()
    },

    finishNotifStep: () => {
      set({ phase: 'main' })
      coach('app_open')
    },

    setTab: (tab) => set({ tab }),
    openSettings: () => set({ showSettings: true }),
    closeSettings: () => set({ showSettings: false }),

    completeWorkout: () => {
      const s = get()
      if (!s.plan || todaysRecord(s)?.completed) return
      const record: DayRecord = {
        date: today(),
        type: 'workout',
        completed: true,
        outcome: 'success',
      }
      const history = [...s.history.filter((r) => r.date !== record.date), record]
      const streak = s.streak + 1
      const longestStreak = Math.max(s.longestStreak, streak)
      set({ history, streak, longestStreak })
      coach('mission_complete')
      if (STREAK_MILESTONES.includes(streak)) coach('achievement')
      set({ celebrating: true, dangerOpen: false })
      persist()
    },

    logCalories: (amount) => {
      const s = get()
      if (!s.plan || todaysRecord(s)?.completed) return
      const over = isCalorieOverage(amount, s.plan.calorieTarget)
      const record: DayRecord = {
        date: today(),
        type: 'rest',
        completed: true,
        caloriesLogged: amount,
        outcome: over ? 'overage' : 'success',
      }
      const history = [...s.history.filter((r) => r.date !== record.date), record]
      const streak = s.streak + 1
      const longestStreak = Math.max(s.longestStreak, streak)
      let shields = s.shields
      const shieldEvents = [...s.shieldEvents]
      if (over) {
        shields = Math.max(0, s.shields - 0.5)
        shieldEvents.push({ date: today(), kind: 'half', reason: 'חריגה קלורית / calorie overage' })
      }
      set({ history, streak, longestStreak, shields, shieldEvents })
      coach(over ? 'half_penalty' : 'mission_complete')
      if (!over && STREAK_MILESTONES.includes(streak)) coach('achievement')
      set({ celebrating: !over, dangerOpen: false })
      persist()
    },

    updateProfile: (patch) => {
      const s = get()
      if (!s.profile) return
      const profile = { ...s.profile, ...patch }
      // Regenerate the plan if anything that affects it changed.
      const planAffecting =
        patch.workoutsPerWeek !== undefined ||
        patch.goal !== undefined ||
        patch.age !== undefined ||
        patch.heightCm !== undefined ||
        patch.weightKg !== undefined
      set({ profile, plan: planAffecting ? generatePlan(profile) : s.plan })
      persist()
    },

    setCoachStyle: (coachStyle) => {
      const s = get()
      if (!s.profile) return
      set({ profile: { ...s.profile, coachStyle } })
      persist()
    },

    setLang: (lang) => {
      set({ lang })
      persist()
    },

    toggleNotifications: (on) => {
      set({ notificationsEnabled: on })
      persist()
    },

    dismissCelebration: () => set({ celebrating: false }),

    openDanger: () => set({ dangerOpen: true }),
    dismissDanger: () => set({ dangerOpen: false, tab: 'home' }),

    logout: () => {
      repository.clearState()
      const fresh = repository.loadState()
      set({
        ...fresh,
        phase: 'onboarding',
        tab: 'home',
        celebrating: false,
        showSettings: false,
        dangerOpen: false,
      })
    },
  }
})

/** Selectors / derived helpers used by screens. */
export function useTodaysMission() {
  // useShallow so the derived object doesn't trigger an infinite render loop.
  return useStore(
    useShallow((s) => {
      const record = s.history.find((r) => r.date === today())
      return {
        dayType: todaysDayType(s),
        completed: !!record?.completed,
        outcome: record?.outcome ?? 'pending',
        caloriesLogged: record?.caloriesLogged,
        calorieTarget: s.plan?.calorieTarget ?? 0,
      }
    }),
  )
}
