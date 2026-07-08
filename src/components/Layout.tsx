import type { ReactNode } from 'react'
import { brand } from '../brand/assets'

/** Small brand lockup for screen headers. */
export function BrandMark({ className = '' }: { className?: string }) {
  return <img src={brand.logo} alt="NO DAYS OFF" className={`object-contain ${className}`} />
}

/** Scrollable screen body with room for the fixed bottom nav. */
export function Screen({
  children,
  title,
  right,
}: {
  children: ReactNode
  title?: string
  right?: ReactNode
}) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <header className="sticky top-0 z-30 flex items-center justify-between px-5 pb-3 pt-5 backdrop-blur-md">
        {title ? (
          <h1 className="font-display text-2xl text-white">{title}</h1>
        ) : (
          <BrandMark className="h-9" />
        )}
        {right}
      </header>
      <main className="flex-1 px-5 pb-32">{children}</main>
    </div>
  )
}
