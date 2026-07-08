import { useState } from 'react'
import { brand } from '../brand/assets'
import { useI18n } from '../i18n/useI18n'
import { Button } from '../components/ui/Button'

interface Props {
  onDone: (granted: boolean) => void
}

/**
 * Requests browser notification permission. True push needs a backend + service
 * worker (out of MVP scope); this gates the foreground Notification API used to
 * simulate the coach's smart nudges.
 */
export function NotifPermission({ onDone }: Props) {
  const { t } = useI18n()
  const [blocked, setBlocked] = useState(false)

  async function requestPermission() {
    if (!('Notification' in window)) {
      onDone(false)
      return
    }
    try {
      const result = await Notification.requestPermission()
      if (result === 'granted') onDone(true)
      else {
        setBlocked(result === 'denied')
        if (result !== 'denied') onDone(false)
      }
    } catch {
      onDone(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-8 px-8 text-center">
      <div className="relative">
        <div
          aria-hidden
          className="absolute inset-0 rounded-full blur-2xl"
          style={{ background: 'radial-gradient(circle, rgba(255,106,0,0.4), transparent 65%)' }}
        />
        <img src={brand.flame} alt="" aria-hidden className="anim-flame relative h-40 w-40 object-contain" />
      </div>

      <div className="anim-rise">
        <h1 className="font-display text-3xl text-white">{t.notifTitle}</h1>
        <p className="mt-3 text-[var(--color-ink-2)]">{t.notifSub}</p>
        {blocked && <p className="mt-3 text-sm text-[var(--color-danger)]">{t.notifBlocked}</p>}
      </div>

      <div className="flex w-full flex-col gap-3">
        <Button fullWidth onClick={requestPermission}>
          {t.notifAllow}
        </Button>
        <Button variant="ghost" fullWidth onClick={() => onDone(false)}>
          {t.notifSkip}
        </Button>
      </div>
    </div>
  )
}
