import { INITIAL_STATE, type AppState } from '../types'

const STORAGE_KEY = 'nodaysoff.state.v1'

/**
 * Single seam between the app and its data store. Everything reads/writes
 * state through here (never localStorage directly) so a real backend can
 * replace the implementation later without touching the store or screens.
 */
export interface Repository {
  loadState(): AppState
  saveState(state: AppState): void
  clearState(): void
}

class LocalStorageRepository implements Repository {
  loadState(): AppState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return { ...INITIAL_STATE }
      const parsed = JSON.parse(raw)
      return { ...INITIAL_STATE, ...parsed }
    } catch {
      return { ...INITIAL_STATE }
    }
  }

  saveState(state: AppState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Storage can be unavailable (private mode, sandboxed iframe). The app
      // stays fully functional in-memory for the session.
    }
  }

  clearState(): void {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }
}

export const repository: Repository = new LocalStorageRepository()
