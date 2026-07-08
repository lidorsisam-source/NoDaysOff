import { useStore } from '../store/appStore'
import { STRINGS, dirFor, type Dict } from './strings'

/** Active-language dictionary + layout direction, driven by the store. */
export function useI18n(): { t: Dict; lang: 'he' | 'en'; dir: 'rtl' | 'ltr' } {
  const lang = useStore((s) => s.lang)
  return { t: STRINGS[lang], lang, dir: dirFor(lang) }
}
