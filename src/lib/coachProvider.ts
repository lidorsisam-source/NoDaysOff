import type { CoachEvent, CoachStyle, Goal, Lang } from '../types'
import { phrasesFrom } from './coachPhrases'

export interface CoachContext {
  name?: string
  streak?: number
  longestStreak?: number
  lang?: Lang
  goal?: Goal
  dayType?: 'workout' | 'rest'
}

/**
 * Map a behavior event onto the coach's signature-phrase categories, so his
 * authentic voice (Hebrew) surfaces for the right moment. Goal- and day-aware
 * where it matters (nutrition nudges pick cutting vs. bulk).
 */
function signatureFor(event: CoachEvent, ctx?: CoachContext): string[] {
  const nutrition = ctx?.goal === 'build-muscle' ? 'bulk' : 'cutting'
  switch (event) {
    case 'app_open':
      return ctx?.dayType === 'rest'
        ? phrasesFrom('flagship', 'phone', 'couch', nutrition)
        : phrasesFrom('beforeWorkout', 'tomorrow', 'couch', 'phone', 'lateHour', 'newsFlash', 'flagship', 'equipment')
    case 'mission_complete':
      return phrasesFrom('afterWorkout', 'flagship')
    case 'full_penalty':
      return phrasesFrom('tomorrow', 'couch', 'lateHour', 'newsFlash')
    case 'half_penalty':
      return phrasesFrom(nutrition, 'fridge')
    case 'new_streak':
    case 'new_month':
      return phrasesFrom('flagship')
    case 'achievement':
      return phrasesFrom('afterWorkout', 'flagship')
  }
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

type StyleBank = Record<CoachStyle, string[]>
type EventBank = Record<CoachEvent, StyleBank>
type MessageBank = Record<Lang, EventBank>

const BANK: MessageBank = {
  he: {
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
      supportive: ['חריגה קטנה, לא סוף העולם 💚', 'המגן ספג חצי - את/ה עדיין בדרך הנכונה.', 'שים לב מחר, זה הכל.'],
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
  },
  en: {
    app_open: {
      beast: ["You're up. Now prove it.", "Let's move — today isn't just another day.", "I'm already here. Question is, are you?"],
      supportive: ['Good to see you back 💚', 'Every day you open this is a small win.', "Let's see what today looks like, together."],
      'tough-love': ['Well, finally.', "Let's see if you keep your word today.", 'You opened the app. Now open up too.'],
    },
    mission_complete: {
      beast: ["That's it! That's how it's done.", 'No stopping. Only forward.', "Another day you're a beast, not an excuse."],
      supportive: ['Genuinely proud of you 💚', "You're building something, day by day.", 'Proud of you for that one.'],
      'tough-love': ['Fine, not bad at all.', 'See — you have it when you want it.', 'Alright, you actually did something today.'],
    },
    full_penalty: {
      beast: ["You missed. The shield took it — don't make a habit of it.", 'It happened. Come back stronger.', "Weak day. Tomorrow won't be."],
      supportive: ["It's okay, everyone has those days 💚", 'Your shield absorbed it — the streak is safe.', "Come on, tomorrow's a new day."],
      'tough-love': ['Come on. That was it.', "Shield took it. It won't take forever.", "Happened. Don't turn it into a habit."],
    },
    half_penalty: {
      beast: ['You went over. Reset.', 'Small slip. Fix it tomorrow.', 'Not ideal. Move on.'],
      supportive: ['Small overage, not the end of the world 💚', "Shield took half — you're still on track.", 'Watch it tomorrow, that’s all.'],
      'tough-love': ['Half a strike. You knew that was coming, right?', 'You went over. At least own it.', "World's not ending, but pay attention."],
    },
    new_streak: {
      beast: ['New streak begins. No breaks this time.', 'From zero. Rebuild — stronger.', 'The flame relights. Guard it.'],
      supportive: ['New streak, clean start 💚', "Every start is a chance. Let's go.", "I'm with you from this new day one."],
      'tough-love': ["Back to zero. Try not to blow it this time.", "New streak. Let's see how long it lasts now.", "Fresh start. Don't waste it."],
    },
    new_month: {
      beast: ['New month, 4 fresh shields. Use them wisely.', 'Monthly reset. Now attack it.', 'New month — time to be unstoppable.'],
      supportive: ['New month, full shields — clean page 💚', 'You got another chance. Enjoy it.', "Let's make this month count."],
      'tough-love': ['New month. Shields reset, no excuses.', "Another chance. Don't waste it like the last.", 'New month. Show me something different.'],
    },
    achievement: {
      beast: ['New milestone! Just the beginning.', 'You broke a record. Now break another.', "That's what happens when you don't quit."],
      supportive: ['Wow, look what you did! So proud 💚', 'Beautiful milestone. Enjoy this moment.', 'You earned this. Well done.'],
      'tough-love': ["Okay, I'll admit — that's impressive.", 'Not bad at all. Keep it up and you might surprise me.', "Milestone. Now don't let it go to your head."],
    },
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
    const lang: Lang = context?.lang ?? 'he'
    const base = BANK[lang][event][style]
    // The Hebrew coach speaks primarily through his signature phrase bank; the
    // per-style base lines add a little tonal variety on top. English has no
    // signature bank (the humor doesn't translate), so it uses base only.
    const pool = lang === 'he' ? [...signatureFor(event, context), ...base] : base
    return interpolate(pickRandom(pool), context)
  }
}

export const coachProvider: CoachProvider = new RuleBasedCoachProvider()
