import { useEffect } from 'react'
import { useStore, DANGER_HOUR } from './store/appStore'
import { useI18n } from './i18n/useI18n'
import { coachProvider } from './lib/coachProvider'
import { toDateKey } from './lib/streak'
import { Splash } from './screens/Splash'
import { Onboarding } from './screens/Onboarding'
import { NotifPermission } from './screens/NotifPermission'
import { Home } from './screens/Home'
import { Progress } from './screens/Progress'
import { Coach } from './screens/Coach'
import { Profile } from './screens/Profile'
import { Settings } from './screens/Settings'
import { FlameDanger } from './screens/FlameDanger'
import { BottomNav } from './components/BottomNav'
import { ErrorBoundary } from './components/ui/states'
import { STRINGS } from './i18n/strings'

const PUSH_KEY = 'nodaysoff.lastPush'
const DANGER_KEY = 'nodaysoff.lastDanger'

function readGate(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeGate(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* storage unavailable — the gate just won't persist */
  }
}

export default function App() {
  const { t, lang, dir } = useI18n()

  const phase = useStore((s) => s.phase)
  const tab = useStore((s) => s.tab)
  const dangerOpen = useStore((s) => s.dangerOpen)
  const init = useStore((s) => s.init)
  const dismissSplash = useStore((s) => s.dismissSplash)
  const completeOnboarding = useStore((s) => s.completeOnboarding)
  const finishNotifStep = useStore((s) => s.finishNotifStep)
  const toggleNotifications = useStore((s) => s.toggleNotifications)
  const setTab = useStore((s) => s.setTab)

  // One-time hydrate + day rollover.
  useEffect(() => {
    init()
  }, [init])

  // Keep <html lang/dir> in sync with the chosen language.
  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = dir
  }, [lang, dir])

  // Evening takeover: mission still open after DANGER_HOUR → the flame is
  // being doused. Shown once per day, on entering the main phase.
  useEffect(() => {
    if (phase !== 'main') return
    const s = useStore.getState()
    if (!s.onboarded) return
    const todayKey = toDateKey(new Date())
    const done = s.history.find((r) => r.date === todayKey)?.completed
    if (done || new Date().getHours() < DANGER_HOUR) return
    if (readGate(DANGER_KEY) === todayKey) return
    writeGate(DANGER_KEY, todayKey)
    s.openDanger()
  }, [phase])

  // Simulated "smart push": a single evening nudge (foreground only) if the
  // day's mission is still open. Real push needs a backend + service worker.
  useEffect(() => {
    if (phase !== 'main') return
    const s = useStore.getState()
    if (!s.notificationsEnabled || !s.profile) return
    if (!('Notification' in window) || Notification.permission !== 'granted') return
    const todayKey = toDateKey(new Date())
    const done = s.history.find((r) => r.date === todayKey)?.completed
    const hour = new Date().getHours()
    if (done || hour < 17) return
    if (readGate(PUSH_KEY) === todayKey) return
    writeGate(PUSH_KEY, todayKey)
    const body = coachProvider.getMessage('app_open', s.profile.coachStyle, {
      lang: s.lang,
      goal: s.profile.goal,
      dayType: s.plan?.days[new Date().getUTCDay()],
    })
    try {
      new Notification('NO DAYS OFF', { body })
    } catch {
      /* ignore — notifications are best-effort in the foreground */
    }
  }, [phase])

  if (phase === 'splash') return <Splash onDone={dismissSplash} />
  if (phase === 'onboarding') return <Onboarding onComplete={completeOnboarding} />
  if (phase === 'notif') {
    return (
      <NotifPermission
        onDone={(granted) => {
          toggleNotifications(granted)
          finishNotifStep()
        }}
      />
    )
  }

  return (
    <ErrorBoundary
      fallbackTitle={STRINGS[lang].errorTitle}
      fallbackBody={STRINGS[lang].errorSub}
      retryLabel={STRINGS[lang].retry}
    >
      {tab === 'home' && <Home />}
      {tab === 'progress' && <Progress />}
      {tab === 'coach' && <Coach />}
      {tab === 'profile' && <Profile />}
      <Settings />
      {dangerOpen && <FlameDanger />}
      <BottomNav tab={tab} onChange={setTab} t={t} />
    </ErrorBoundary>
  )
}
