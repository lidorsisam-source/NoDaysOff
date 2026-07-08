import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
  fullWidth?: boolean
  children: ReactNode
}

const base =
  'font-display text-lg tracking-wide inline-flex items-center justify-center gap-2 rounded-[18px] px-6 select-none pressable disabled:opacity-45 disabled:pointer-events-none'

const variants: Record<Variant, string> = {
  primary:
    'text-black bg-[var(--color-orange)] shadow-[0_10px_30px_-10px_rgba(255,106,0,0.8)] hover:brightness-105',
  secondary:
    'text-white bg-[var(--color-elevated)] border border-[var(--color-line-2)] hover:bg-[#242424]',
  ghost: 'text-[var(--color-ink-2)] bg-transparent hover:text-white',
}

export function Button({
  variant = 'primary',
  loading = false,
  fullWidth = false,
  disabled,
  children,
  className = '',
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading}
      style={{ height: 58 }}
      className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {loading ? <Spinner /> : children}
    </button>
  )
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block h-5 w-5 rounded-full border-2 border-black/30 border-t-black animate-spin"
    />
  )
}
