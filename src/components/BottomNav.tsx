import type { Tab } from '../store/appStore'
import type { Dict } from '../i18n/strings'

interface Props {
  tab: Tab
  onChange: (tab: Tab) => void
  t: Dict
}

const icons: Record<Tab, string> = {
  home: 'M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-6H9v6H5a2 2 0 0 1-2-2z',
  progress: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  coach: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  profile: 'M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM3 22a9 9 0 0 1 18 0',
}

const order: Tab[] = ['home', 'progress', 'coach', 'profile']

export function BottomNav({ tab, onChange, t }: Props) {
  const labels: Record<Tab, string> = {
    home: t.navHome,
    progress: t.navProgress,
    coach: t.navCoach,
    profile: t.navProfile,
  }
  return (
    <nav
      className="pointer-events-auto fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label={labels.home}
    >
      <div className="mx-3 mb-3 flex items-stretch justify-around rounded-[22px] border border-[var(--color-line-2)] bg-[rgba(18,18,18,0.72)] px-2 py-2 backdrop-blur-xl shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.8)]">
        {order.map((key) => {
          const active = tab === key
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              aria-current={active ? 'page' : undefined}
              className="pressable relative flex min-h-11 flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-1"
            >
              {active && (
                <span
                  aria-hidden
                  className="absolute inset-x-3 -top-2 h-1 rounded-full bg-[var(--color-orange)] shadow-[var(--shadow-glow)]"
                />
              )}
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6 transition-colors"
                fill="none"
                stroke={active ? 'var(--color-orange)' : 'var(--color-ink-3)'}
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={icons[key]} />
              </svg>
              <span
                className="text-[10px] font-semibold transition-colors"
                style={{ color: active ? '#fff' : 'var(--color-ink-3)' }}
              >
                {labels[key]}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
