import { useState } from 'react'
import { brand } from '../brand/assets'

interface Props {
  /** Play the living-portrait video loop (falls back to the static portrait). */
  live?: boolean
  /** Classes for the outer frame (size it here). */
  className?: string
  /** Classes for the media element itself (e.g. scale). */
  mediaClassName?: string
  /** object-position for the crop. */
  position?: string
  /** Darken the bottom for text overlays. */
  shade?: boolean
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

/**
 * The coach's face, everywhere it appears. When `live`, plays the muted
 * breathing-loop video with the static portrait as poster; any failure (or a
 * reduced-motion preference) silently falls back to the still image.
 */
export function CoachPortrait({
  live = false,
  className = '',
  mediaClassName = '',
  position = '50% 10%',
  shade = false,
}: Props) {
  const [videoFailed, setVideoFailed] = useState(false)
  const showVideo = live && !videoFailed && !prefersReducedMotion()

  return (
    <div className={`relative overflow-hidden bg-black ring-1 ring-[var(--color-line-2)] ${className}`}>
      {showVideo ? (
        <video
          poster={brand.coach}
          autoPlay
          muted
          loop
          playsInline
          disablePictureInPicture
          onError={() => setVideoFailed(true)}
          className={`h-full w-full object-cover ${mediaClassName}`}
          style={{ objectPosition: position }}
          aria-hidden
        >
          <source src={brand.coachMotionWebm} type="video/webm" />
          {/* When no source is playable, the error event fires on the last <source>. */}
          <source src={brand.coachMotionMp4} type="video/mp4" onError={() => setVideoFailed(true)} />
        </video>
      ) : (
        <img
          src={brand.coach}
          alt=""
          aria-hidden
          className={`h-full w-full object-cover ${mediaClassName}`}
          style={{ objectPosition: position }}
        />
      )}
      {shade && (
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      )}
    </div>
  )
}
