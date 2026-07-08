import type { AppState, CoachEvent, DayRecord, ShieldEvent } from '../types'

export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function monthKey(date: Date): string {
  return date.toISOString().slice(0, 7)
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

function parseDateKey(key: string): Date {
  return new Date(`${key}T00:00:00Z`)
}

export const STREAK_MILESTONES = [7, 14, 30, 60, 100, 200, 365]

export interface RollForwardResult {
  state: AppState
  events: CoachEvent[]
}

/**
 * Walks every fully-elapsed day between `state.lastCheckedDate` and `today`
 * (exclusive of today, which is still "in progress") and, for any day that
 * never got a completion recorded, applies the miss penalty: a full shield
 * if any remain, otherwise the flame goes out and the streak resets to 0.
 * Also rolls shields over to 4 at each month boundary crossed along the way.
 * Pure function - callers persist the returned state.
 */
export function rollForward(state: AppState, today: Date): RollForwardResult {
  const todayKey = toDateKey(today)
  const events: CoachEvent[] = []

  if (!state.plan || !state.onboarded) {
    return { state: { ...state, lastCheckedDate: todayKey }, events }
  }

  if (!state.lastCheckedDate) {
    return {
      state: { ...state, lastCheckedDate: todayKey, shieldMonth: state.shieldMonth || monthKey(today) },
      events,
    }
  }

  if (state.lastCheckedDate >= todayKey) {
    return { state, events }
  }

  let streak = state.streak
  let longestStreak = state.longestStreak
  let shields = state.shields
  let shieldMonth = state.shieldMonth
  const shieldEvents: ShieldEvent[] = [...state.shieldEvents]
  const history: DayRecord[] = [...state.history]
  const historyDates = new Set(history.map((h) => h.date))

  let cursor = addDays(parseDateKey(state.lastCheckedDate), 1)
  while (toDateKey(cursor) < todayKey) {
    const dateKey = toDateKey(cursor)
    const cursorMonth = monthKey(cursor)

    if (cursorMonth !== shieldMonth) {
      shieldMonth = cursorMonth
      shields = 4
      events.push('new_month')
    }

    if (!historyDates.has(dateKey)) {
      const dayType = state.plan.days[cursor.getUTCDay()]
      history.push({ date: dateKey, type: dayType, completed: false, outcome: 'missed' })

      if (shields > 0) {
        shields -= 1
        shieldEvents.push({ date: dateKey, kind: 'full', reason: 'יום אימון הוחמץ' })
      } else if (streak > 0) {
        longestStreak = Math.max(longestStreak, streak)
        streak = 0
      }

      events.push('full_penalty')
    }

    cursor = addDays(cursor, 1)
  }

  return {
    state: {
      ...state,
      streak,
      longestStreak,
      shields,
      shieldMonth,
      shieldEvents,
      history,
      lastCheckedDate: todayKey,
    },
    events,
  }
}
