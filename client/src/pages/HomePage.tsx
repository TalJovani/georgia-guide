import {
  Baby,
  Car,
  Church,
  Compass,
  Heart,
  Landmark,
  Languages,
  type LucideIcon,
  MessageCircle,
  Mountain,
  PiggyBank,
  UtensilsCrossed,
  Wine,
} from 'lucide-react'
import { Link } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { ReviewsSection } from '../components/ReviewsSection'
import { cardClassName, primaryButtonClassName, secondaryButtonClassName } from '../lib/styles'

// Three colors take turns down the page: terracotta roofs, Caucasus green, mountain sky.
// Written out in full so Tailwind can see every class.
type Tone = 'brand' | 'accent' | 'sky'
const toneTile: Record<Tone, string> = {
  brand: 'bg-brand-soft text-brand',
  accent: 'bg-accent-soft text-accent',
  sky: 'bg-sky-soft text-sky',
}
const toneSolid: Record<Tone, string> = {
  brand: 'bg-brand text-on-brand',
  accent: 'bg-accent text-on-brand',
  sky: 'bg-sky text-on-sky',
}
const tones: Tone[] = ['brand', 'accent', 'sky']
const toneAt = (index: number) => tones[index % tones.length]

// Where a trip with Miki can take you. Real places; the list isn't the limit.
const places: { name: string; text: string; icon: LucideIcon; tone: Tone }[] = [
  {
    name: 'טביליסי',
    text: 'העיר העתיקה, מרחצאות הגופרית והסמטאות שמסביב',
    icon: Landmark,
    tone: 'brand',
  },
  {
    name: 'קאחתי',
    text: 'ארץ היין: יקבים משפחתיים והעיירה סיגנאגי',
    icon: Wine,
    tone: 'accent',
  },
  {
    name: 'קזבגי',
    text: 'הרי הקווקז וכנסיית גרגטי מעל העננים',
    icon: Mountain,
    tone: 'sky',
  },
  {
    name: 'מצחתה',
    text: 'הבירה העתיקה, עם מנזרים בני מאות שנים',
    icon: Church,
    tone: 'brand',
  },
]

// Why book with Miki: what the traveler gets. Every line here is a promise, so only true ones.
const reasons: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Languages,
    title: 'מדבר את השפה שלכם',
    text: 'עברית, אנגלית וגיאורגית. איתכם בעברית, ועם המקומיים בשפה שלהם.',
  },
  {
    icon: Compass,
    title: 'יליד המקום',
    text: 'נולד בגיאורגיה ונוסע אליה כמעט כל חודש, אז הוא תמיד מעודכן במה ששווה לראות.',
  },
  {
    icon: UtensilsCrossed,
    title: 'כשר לכל רמה',
    text: 'מסעדות שמתאימות בדיוק לכשרות שלכם, מכשר־סטייל ועד מהדרין.',
  },
  {
    icon: Baby,
    title: 'מתאים גם לילדים',
    text: 'אטרקציות ונופים שמתאימים לכל הגילים, כדי שכל המשפחה תיהנה.',
  },
  {
    icon: Car,
    title: 'הכול לפי מה שנוח לכם',
    text: 'מסלול, קצב ואטרקציות לפי הטעם שלכם. צריכים רכב? מיקי ידאג לרכב שכור.',
  },
  {
    icon: PiggyBank,
    title: 'מחירים מוזלים',
    text: 'בלי פערי תיווך של חברת טיולים גדולה: מקבלים יותר טיול על אותו תקציב.',
  },
]

// What you get, in three words, right under the headline.
const highlights: { icon: LucideIcon; text: string; tone: Tone }[] = [
  { icon: Heart, text: 'מסלול אישי', tone: 'brand' },
  { icon: Languages, text: 'בעברית', tone: 'accent' },
  { icon: MessageCircle, text: 'ליווי בטלפון', tone: 'sky' },
]

const steps = [
  'ספרו לנו איזה טיול אתם רוצים: תאריכים, תקציב ומה אתם אוהבים.',
  'מיקי בונה לכם מסלול אישי, יום אחרי יום.',
  'משנים ומדייקים יחד, עד שהכול בדיוק כמו שרציתם.',
  'יוצאים לדרך, ומיקי מכווין אתכם בטלפון ובצ׳אט לאורך כל הטיול, בזמן אמת.',
]

// The nth piece of an entrance starts 50ms after the one before it.
function stagger(index: number) {
  return { transitionDelay: `${index * 50}ms` }
}

// The landing page: who Miki is, what a trip looks like, what travelers say.
// Everyone sees it, signed in or not; the buttons change with who is looking.
export function HomePage() {
  return (
    <div className="space-y-12">
      {/* The opening rises into place one piece after another, 50ms apart: a welcome for
          a page most people see once. Decorative only; everything is clickable right away. */}
      <section className="space-y-4">
        <div className="enter">
          <Scenery />
        </div>
        <p className="enter text-sm font-bold tracking-wide text-accent" style={stagger(1)}>
          Georgia Trips
        </p>
        <h1
          className="enter font-display text-4xl leading-tight text-balance text-ink"
          style={stagger(2)}
        >
          גיאורגיה כמו <span className="text-brand">שרק מקומי</span> מכיר
        </h1>
        <p className="enter text-muted" style={stagger(3)}>
          טיולים אישיים עם מיקי, שנולד וגדל בגיאורגיה ומכיר אותה כמו את כף ידו. מקומות ונופים שלא
          תמצאו במדריכי הטיולים, ומסלול שנבנה רק בשבילכם.
        </p>
        <ul className="enter flex flex-wrap gap-2" style={stagger(4)} aria-label="מה מקבלים">
          {highlights.map(({ icon: Icon, text, tone }) => (
            <li
              key={text}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${toneTile[tone]}`}
            >
              <Icon className="icon" />
              {text}
            </li>
          ))}
        </ul>
        <div className="enter" style={stagger(5)}>
          <MainActions />
        </div>
      </section>

      <section aria-labelledby="miki-title" className="space-y-3 rounded-2xl bg-accent-soft p-5">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-14 shrink-0 place-items-center rounded-full bg-linear-to-br from-brand to-accent font-display text-2xl text-on-brand shadow-button"
          >
            מ
          </span>
          <h2 id="miki-title" className="font-display text-2xl text-accent">
            נעים להכיר, מיקי
          </h2>
        </div>
        <p>
          הכול התחיל מרעיון פשוט: להראות לאנשים את היופי של גיאורגיה, המקום שבו נולד. מיקי יודע
          להגיע למקומות ולנופים שרק מקומיים מכירים.
        </p>
        <p>
          הוא משקיע בתכנון כל טיול עד הפרט הכי קטן, כדי שלמטיילים שלו יהיה את הטיול המושלם, והוא
          עדיין מתרגש מכל טיול מחדש.
        </p>
        <ul className="flex flex-wrap gap-2" aria-label="מיקי בשלוש מילים">
          {['סבלני', 'קשוב', 'הרפתקן'].map((trait, index) => (
            <li
              key={trait}
              className={`rounded-full px-3 py-1 text-sm font-bold ${toneSolid[toneAt(index)]}`}
            >
              {trait}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="why-title" className="space-y-3">
        <h2 id="why-title" className="font-display text-2xl text-brand">
          למה לטייל עם מיקי
        </h2>
        <ul className="grid grid-cols-2 gap-2">
          {reasons.map(({ icon: Icon, title, text }, index) => (
            <li key={title} className={`${cardClassName} space-y-2`}>
              <span
                aria-hidden="true"
                className={`grid size-10 place-items-center rounded-xl ${toneTile[toneAt(index)]}`}
              >
                <Icon className="size-5" strokeWidth={2.25} />
              </span>
              <strong className="block leading-snug">{title}</strong>
              <p className="text-sm text-muted">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="places-title" className="space-y-3">
        <h2 id="places-title" className="font-display text-2xl text-brand">
          לאן אפשר להגיע
        </h2>
        <ul className="grid grid-cols-2 gap-2">
          {places.map(({ name, text, icon: Icon, tone }) => (
            <li key={name} className={`space-y-1.5 rounded-xl p-4 ${toneTile[tone]}`}>
              <Icon aria-hidden="true" className="size-6" strokeWidth={2} />
              <strong className="block font-display text-xl">{name}</strong>
              <p className="text-sm text-ink">{text}</p>
            </li>
          ))}
        </ul>
        <div className="flex items-start gap-3 rounded-xl bg-linear-to-l from-brand-soft to-sky-soft p-4">
          <UtensilsCrossed aria-hidden="true" className="mt-1 size-6 shrink-0 text-brand" />
          <div className="space-y-1">
            <strong className="font-display text-lg text-brand">וגם האוכל</strong>
            <p className="text-sm">
              חצ׳אפורי חם מהתנור, חינקלי עסיסי ועוד הרבה טעמים מקומיים שמיקי יודע איפה עושים הכי
              טוב.
            </p>
          </div>
        </div>
        <p className="text-sm text-muted">
          ועוד אגמים, הרים ופינות שרק מקומיים מכירים. ספרו למיקי מה אתם אוהבים, והוא כבר יידע לאן
          לקחת אתכם.
        </p>
      </section>

      <section aria-labelledby="how-title" className="space-y-3">
        <h2 id="how-title" className="font-display text-2xl text-brand">
          איך זה עובד
        </h2>
        {/* A real sequence, so the numbers carry meaning; a line joins the steps into a path. */}
        <ol className="relative space-y-4 before:absolute before:inset-y-4 before:start-4 before:w-0.5 before:bg-line">
          {steps.map((step, index) => (
            <li key={step} className="relative flex items-start gap-3">
              <span
                className={`grid size-8 shrink-0 place-items-center rounded-full font-display text-lg ${toneSolid[toneAt(index)]}`}
              >
                {index + 1}
              </span>
              <p className="pt-1">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <ReviewsSection />

      <section className="space-y-4 rounded-2xl bg-linear-to-br from-brand to-accent p-6 text-center text-on-brand shadow-card">
        <h2 className="font-display text-3xl text-balance">מוכנים לגלות את גיאורגיה?</h2>
        <p className="opacity-90">ספרו למיקי מה אתם אוהבים, והוא יבנה לכם את הטיול.</p>
        <MainActions onColor />
      </section>
    </div>
  )
}

// The next step for whoever is looking: sign up, plan a trip, or go to the guide's board.
// `onColor` is for the colored closing band, where the usual buttons would disappear.
function MainActions({ onColor = false }: { onColor?: boolean }) {
  const { user } = useAuth()
  const first = onColor
    ? 'press rounded-xl bg-surface py-2.5 text-center font-bold text-brand shadow-button'
    : primaryButtonClassName
  const second = onColor
    ? 'press rounded-xl border-[1.5px] border-current py-2.5 text-center font-bold'
    : secondaryButtonClassName

  if (user?.role === 'GUIDE') {
    return (
      <Link to="/guide" className={`${first} block`}>
        ללוח המדריך
      </Link>
    )
  }
  if (user?.role === 'TRAVELER') {
    return (
      <div className="flex gap-3">
        <Link to="/trips/new" className={`${first} flex-1`}>
          בקשת טיול חדשה
        </Link>
        <Link to="/trips" className={`${second} flex-1`}>
          הטיולים שלי
        </Link>
      </div>
    )
  }
  return (
    <div className="flex gap-3">
      <Link to="/register" className={`${first} flex-1`}>
        בואו נתכנן טיול
      </Link>
      <Link to="/login" className={`${second} flex-1`}>
        כבר יש לי חשבון
      </Link>
    </div>
  )
}

// The Caucasus over Tbilisi, drawn in the site's colors: sky, sun, snowy peaks, green slopes,
// and the terracotta roofs of the old town. A stand-in until there are real photos.
function Scenery() {
  return (
    <svg
      viewBox="0 0 400 160"
      role="img"
      aria-label="איור של הרי הקווקז מעל גגות טביליסי"
      className="h-auto w-full rounded-2xl bg-sky-soft"
    >
      <circle cx="300" cy="56" r="22" className="fill-ai opacity-80" />
      <path
        d="M0 160 L0 98 L70 46 L120 86 L185 22 L250 92 L300 64 L400 118 L400 160 Z"
        className="fill-sky opacity-45"
      />
      <path d="M185 22 L168 38 L178 36 L186 44 L194 35 L202 39 Z" className="fill-surface" />
      <path d="M70 46 L58 55 L66 54 L72 60 L78 53 L84 56 Z" className="fill-surface" />
      <path
        d="M0 160 L0 124 L90 82 L160 116 L230 74 L320 120 L400 96 L400 160 Z"
        className="fill-accent opacity-80"
      />
      <path
        d="M0 160 L0 146 L18 146 L28 136 L38 146 L58 146 L58 140 L70 130 L82 140 L82 146 L104 146 L116 134 L128 146 L150 146 L150 150 L400 150 L400 160 Z"
        className="fill-brand"
      />
      <path
        d="M300 160 L300 146 L312 136 L324 146 L340 146 L352 132 L364 146 L380 146 L390 138 L400 144 L400 160 Z"
        className="fill-brand"
      />
    </svg>
  )
}
