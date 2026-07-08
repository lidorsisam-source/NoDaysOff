import type { ReactNode } from 'react'
import { Component, type ErrorInfo } from 'react'
import { Button } from './Button'

/** Shimmer skeleton block for loading states. */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-[var(--color-surface-2)] ${className}`}
      aria-hidden
    >
      <div className="absolute inset-0 anim-fade bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  body,
}: {
  icon?: ReactNode
  title: string
  body: string
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-8 py-14 text-center">
      {icon && <div className="text-4xl opacity-70">{icon}</div>}
      <h3 className="font-display text-xl text-white">{title}</h3>
      <p className="max-w-xs text-sm text-[var(--color-ink-2)]">{body}</p>
    </div>
  )
}

export function ErrorState({
  title,
  body,
  retryLabel,
  onRetry,
}: {
  title: string
  body: string
  retryLabel?: string
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-8 py-14 text-center">
      <div
        aria-hidden
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(255,77,77,0.12)] text-2xl text-[var(--color-danger)]"
      >
        !
      </div>
      <h3 className="font-display text-xl text-white">{title}</h3>
      <p className="max-w-xs text-sm text-[var(--color-ink-2)]">{body}</p>
      {onRetry && retryLabel && (
        <Button variant="secondary" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  )
}

/** App-level error boundary rendering a recoverable error card. */
export class ErrorBoundary extends Component<
  { children: ReactNode; fallbackTitle: string; fallbackBody: string; retryLabel: string },
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App error boundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-dvh items-center justify-center">
          <ErrorState
            title={this.props.fallbackTitle}
            body={this.props.fallbackBody}
            retryLabel={this.props.retryLabel}
            onRetry={() => this.setState({ hasError: false })}
          />
        </div>
      )
    }
    return this.props.children
  }
}
