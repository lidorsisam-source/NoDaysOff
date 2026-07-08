import { useStore } from '../store/appStore'
import { useI18n } from '../i18n/useI18n'
import { LANGS } from '../i18n/strings'
import { Button } from '../components/ui/Button'

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className="relative h-7 w-12 shrink-0 rounded-full transition-colors"
      style={{ background: on ? 'var(--color-orange)' : 'var(--color-line-2)' }}
    >
      <span
        className="absolute top-1 h-5 w-5 rounded-full bg-white transition-all"
        style={{ insetInlineStart: on ? 24 : 4 }}
      />
    </button>
  )
}

export function Settings() {
  const { t, lang } = useI18n()
  const show = useStore((s) => s.showSettings)
  const close = useStore((s) => s.closeSettings)
  const notifications = useStore((s) => s.notificationsEnabled)
  const toggleNotifications = useStore((s) => s.toggleNotifications)
  const setLang = useStore((s) => s.setLang)
  const logout = useStore((s) => s.logout)

  if (!show) return null

  async function onToggleNotifications(next: boolean) {
    if (next && 'Notification' in window && Notification.permission === 'default') {
      try {
        const res = await Notification.requestPermission()
        toggleNotifications(res === 'granted')
        return
      } catch {
        toggleNotifications(false)
        return
      }
    }
    toggleNotifications(next)
  }

  return (
    <div className="fixed inset-0 z-50 anim-fade" role="dialog" aria-modal="true" aria-label={t.settingsTitle}>
      <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-[var(--color-bg)]">
        <header className="flex items-center justify-between px-5 pb-3 pt-5">
          <h1 className="font-display text-2xl text-white">{t.settingsTitle}</h1>
          <button
            onClick={close}
            aria-label={t.obBack}
            className="pressable flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-line-2)] bg-[var(--color-surface)] text-lg text-white"
          >
            ✕
          </button>
        </header>

        <main className="flex-1 px-5">
          <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-surface)]">
            <div className="flex items-center justify-between border-b border-[var(--color-line)] px-4 py-4">
              <span className="text-white">{t.notifications}</span>
              <Toggle on={notifications} onChange={onToggleNotifications} label={t.notifications} />
            </div>

            <div className="flex items-center justify-between border-b border-[var(--color-line)] px-4 py-4">
              <span className="text-white">{t.language}</span>
              <div className="flex gap-2">
                {LANGS.map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    aria-pressed={lang === l}
                    className="pressable rounded-xl px-4 py-2 text-sm font-bold transition-colors"
                    style={{
                      background: lang === l ? 'var(--color-orange)' : 'var(--color-elevated)',
                      color: lang === l ? '#000' : 'var(--color-ink-2)',
                    }}
                  >
                    {l === 'he' ? 'עברית' : 'EN'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between px-4 py-4">
              <div>
                <span className="block text-white">{t.reduceMotion}</span>
                <span className="text-xs text-[var(--color-ink-3)]">{t.reduceMotionSub}</span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Button variant="secondary" fullWidth onClick={logout}>
              {t.logout}
            </Button>
          </div>
        </main>
      </div>
    </div>
  )
}
