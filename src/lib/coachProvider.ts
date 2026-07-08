import type { CoachEvent, CoachStyle } from '../types'

export interface CoachContext {
  name?: string
  streak?: number
  longestStreak?: number
}

/**
 * The coach never chats or answers free-form questions — it only reacts to
 * events. `getMessage` is the whole seam: today it's a rule-based bank, but
 * the interface leaves room for a future implementation that calls an LLM
 * (once a backend + API key exist) to enrich or replace these lines without
 * any call site changing.
 */
export interface CoachProvider {
  getMessage(event: CoachEvent, style: CoachStyle, context?: CoachContext): string
}

type MessageBank = Record<CoachEvent, Record<CoachStyle, string[]>>

const BANK: MessageBank = {
  app_open: {
    beast: ['קמת. עכשיו תוכיח את זה.', 'בוא נזוז - היום לא סתם עוד יום.', 'אני כבר פה. השאלה אם אתה.'],
    supportive: ['שמח לראות אותך כאן שוב 💚', 'כל יום שאתה פותח את זה - זה ניצחון קטן.', 'בוא נראה מה יש לנו היום, ביחד.'],
    'tough-love': ['נו, סוף סוף הגעת.', 'בוא נראה אם היום תעמוד במילה שלך.', 'פתחת את האפליקציה. עכשיו תפתח גם את עצמך.'],
  },
  mission_complete: {
    beast: ['זהו! ככה עושים את זה.', 'אין עצירות. רק התקדמות.', 'עוד יום שאתה חיה, לא תירוץ.'],
    supportive: ['כל הכבוד לך, באמת 💚', 'אתה בונה משהו יפה, יום אחרי יום.', 'גאה בך על זה.'],
    'tough-love': ['בסדר, לא נורא בכלל.', 'רואים שיש לך את זה כשאתה רוצה.', 'טוב, הפעם באמת עשית משהו.'],
  },
  full_penalty: {
    beast: ['פספסת. המגן ספג בשבילך - אל תרגיל את זה.', 'זה קרה. עכשיו תחזור חזק יותר.', 'יום חלש. מחר לא יהיה כזה.'],
    supportive: ['זה בסדר, לכולם יש ימים כאלה 💚', 'המגן שלך ספג את זה בשבילך - הרצף בטוח.', 'קדימה, מחר יום חדש.'],
    'tough-love': ['נו באמת. זהו זה.', 'המגן ספג. הוא לא יספוג לנצח.', 'קרה. אל תעשה מזה הרגל.'],
  },
  half_penalty: {
    beast: ['חרגת בקלוריות. תתאפס.', 'קצת נפילה. תתקן מחר.', 'לא אידיאלי. תזוז הלאה.'],
    supportive: ['חריגה קטנה, לא סוף העולם 💚', 'המגן ספג חצי - את/ה עדיין בדרך הנכונה.', 'שימי לב מחר, זה הכל.'],
    'tough-love': ['חצי פסילה. ידעת שזה יקרה, נכון?', 'חרגת. לפחות תהיה מודע לזה.', 'לא נגמר העולם, אבל תשים לב.'],
  },
  new_streak: {
    beast: ['רצף חדש מתחיל. הפעם בלי הנחות.', 'מאפס. עכשיו בונים מחדש - חזק יותר.', 'הלהבה נדלקת מחדש. תשמור עליה.'],
    supportive: ['רצף חדש, התחלה נקייה 💚', 'כל התחלה היא הזדמנות. בוא נלך.', 'אני איתך מהיום הראשון החדש הזה.'],
    'tough-love': ['שוב מאפס. הפעם תנסה לא לפשל.', 'רצף חדש. בוא נראה כמה זמן יחזיק הפעם.', 'התחלה חדשה. אל תבזבז אותה.'],
  },
  new_month: {
    beast: ['חודש חדש, 4 מגנים טריים. תשתמש בהם בחוכמה.', 'איפוס חודשי. עכשיו תתקוף אותו.', 'חודש חדש - הזמן להיות בלתי עצור.'],
    supportive: ['חודש חדש עם מגנים מלאים - דף חדש 💚', 'קיבלת עוד הזדמנות. תיהנה ממנה.', 'בוא נעשה מהחודש הזה משהו טוב.'],
    'tough-love': ['חודש חדש. המגנים התאפסו, אין תירוצים.', 'עוד הזדמנות. אל תבזבז אותה כמו הקודמת.', 'חודש חדש. תראה לי משהו שונה הפעם.'],
  },
  achievement: {
    beast: ['הישג חדש! זה רק ההתחלה.', 'שברת שיא. עכשיו תשבור עוד אחד.', 'זה מה שקורה כשלא מוותרים.'],
    supportive: ['וואו, תראה מה עשית! גאה בך מאוד 💚', 'הישג יפהפה. תיהנה מהרגע הזה.', 'הגעת לכאן בזכות עצמך. כל הכבוד.'],
    'tough-love': ['בסדר, אני מודה - זה מרשים.', 'לא רע בכלל. תמשיך ככה ואולי תפתיע אותי עוד.', 'הישג. עכשיו אל תתפוצץ מזה.'],
  },
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

function interpolate(message: string, context?: CoachContext): string {
  if (!context?.name) return message
  return message.replace('{name}', context.name)
}

class RuleBasedCoachProvider implements CoachProvider {
  getMessage(event: CoachEvent, style: CoachStyle, context?: CoachContext): string {
    const variants = BANK[event][style]
    return interpolate(pickRandom(variants), context)
  }
}

export const coachProvider: CoachProvider = new RuleBasedCoachProvider()
