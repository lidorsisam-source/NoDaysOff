import { useEffect } from 'react'
import { brand } from '../brand/assets'
import { useI18n } from '../i18n/useI18n'

export function Splash({ onDone }: { onDone: () => void }) {
  const { t } = useI18n()

  useEffect(() => {
    const id = setTimeout(onDone, 1900)
    return () => clearTimeout(id)
  }, [onDone])

  return (
    <button
      onClick={onDone}
      aria-label={t.tagline}
      className="flex min-h-dvh w-full flex-col items-center justify-center gap-6 px-8"
    >
      <img src={brand.logo} alt="NO DAYS OFF" className="anim-splash w-64 max-w-[70vw] object-contain" />
      <p className="font-display anim-fade text-sm tracking-[0.28em] text-[var(--color-ink-2)]">
        {t.tagline}
      </p>
      <div className="absolute bottom-14 flex items-center gap-2 text-[var(--color-ink-3)]">
        <span className="h-1.5 w-1.5 animate-ping rounded-full bg-[var(--color-orange)]" />
      </div>
    </button>
  )
}
