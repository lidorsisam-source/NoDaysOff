/**
 * Single source of truth for brand asset paths. Files live in `public/brand/`
 * and are served from the site root. To swap in updated official art, replace
 * the PNGs in `public/brand/` with the same filenames — no code changes needed.
 */
export const brand = {
  /** Primary lockup: rhino head + "NO DAYS OFF" wordmark. Splash + headers. */
  logo: '/brand/logo.png',
  /** Alternate lockup: flame/bolt + wordmark. */
  logoFlame: '/brand/logo-flame.png',
  /** Flame/bolt mark on its own — drives the streak / Flame component. */
  flame: '/brand/flame.png',
  /** Coach character portrait (static). */
  coach: '/brand/coach.png',
  /** Coach living-portrait loop (muted video; static portrait is the poster/fallback). */
  coachMotionWebm: '/brand/coach-motion.webm',
  coachMotionMp4: '/brand/coach-motion.mp4',
} as const
