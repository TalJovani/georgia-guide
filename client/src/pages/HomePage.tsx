import { Link } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { ReviewsSection } from '../components/ReviewsSection'
import { cardClassName, primaryButtonClassName, secondaryButtonClassName } from '../lib/styles'

// Where a trip with Miki can take you. Real places; the list isn't the limit.
const places = [
  { name: 'טביליסי', text: 'העיר העתיקה, מרחצאות הגופרית והסמטאות שמסביב' },
  { name: 'קאחתי', text: 'ארץ היין: יקבים משפחתיים והעיירה סיגנאגי' },
  { name: 'קזבגי', text: 'הרי הקווקז וכנסיית גרגטי מעל העננים' },
  { name: 'מצחתה', text: 'הבירה העתיקה, עם מנזרים בני מאות שנים' },
]

// Why book with Miki: what the traveler gets. Every line here is a promise, so only true ones.
const reasons = [
  {
    icon: '🗣',
    title: 'מדבר את השפה שלכם',
    text: 'עברית, אנגלית וגיאורגית. איתכם בעברית, ועם המקומיים בשפה שלהם.',
  },
  {
    icon: '🧭',
    title: 'יליד המקום',
    text: 'נולד בגיאורגיה ונוסע אליה כמעט כל חודש, אז הוא תמיד מעודכן במה ששווה לראות.',
  },
  {
    icon: '🍽',
    title: 'כשר לכל רמה',
    text: 'מסעדות שמתאימות בדיוק לכשרות שלכם, מכשר־סטייל ועד מהדרין.',
  },
  {
    icon: '👨‍👩‍👧',
    title: 'מתאים גם לילדים',
    text: 'אטרקציות ונופים שמתאימים לכל הגילים, כדי שכל המשפחה תיהנה.',
  },
  {
    icon: '🚗',
    title: 'הכול לפי מה שנוח לכם',
    text: 'מסלול, קצב ואטרקציות לפי הטעם שלכם. צריכים רכב? מיקי ידאג לרכב שכור.',
  },
  {
    icon: '💰',
    title: 'מחירים מוזלים',
    text: 'בלי פערי תיווך של חברת טיולים גדולה: מקבלים יותר טיול על אותו תקציב.',
  },
]

const steps = [
  'ספרו לנו איזה טיול אתם רוצים: תאריכים, תקציב ומה אתם אוהבים.',
  'מיקי בונה לכם מסלול אישי, יום אחרי יום.',
  'משנים ומדייקים יחד, עד שהכול בדיוק כמו שרציתם.',
  'יוצאים לדרך, ומיקי מכווין אתכם בטלפון ובצ׳אט לאורך כל הטיול, בזמן אמת.',
]

// The landing page: who Miki is, what a trip looks like, what travelers say.
// Everyone sees it, signed in or not; the buttons change with who is looking.
export function HomePage() {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <Scenery />
        <p className="text-sm font-bold tracking-wide text-accent">Georgia Trips</p>
        <h1 className="font-display text-4xl leading-tight text-balance text-brand">
          גיאורגיה כמו שרק מקומי מכיר
        </h1>
        <p className="text-muted">
          טיולים אישיים עם מיקי, שנולד וגדל בגיאורגיה ומכיר אותה כמו את כף ידו. מקומות ונופים
          שלא תמצאו במדריכי הטיולים, ומסלול שנבנה רק בשבילכם.
        </p>
        <MainActions />
      </section>

      <section aria-labelledby="miki-title" className={`${cardClassName} space-y-3`}>
        <h2 id="miki-title" className="font-display text-2xl text-brand">
          נעים להכיר, מיקי
        </h2>
        <p>
          הכול התחיל מרעיון פשוט: להראות לאנשים את היופי של גיאורגיה, המקום שבו נולד. מיקי יודע
          להגיע למקומות ולנופים שרק מקומיים מכירים.
        </p>
        <p>
          הוא משקיע בתכנון כל טיול עד הפרט הכי קטן, כדי שלמטיילים שלו יהיה את הטיול המושלם, והוא
          עדיין מתרגש מכל טיול מחדש.
        </p>
        <ul className="flex flex-wrap gap-2" aria-label="מיקי בשלוש מילים">
          {['סבלני', 'קשוב', 'הרפתקן'].map((trait) => (
            <li
              key={trait}
              className="rounded-full bg-accent-soft px-3 py-1 text-sm font-bold text-accent"
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
          {reasons.map((reason) => (
            <li key={reason.title} className={`${cardClassName} space-y-1`}>
              <span aria-hidden="true" className="text-2xl">
                {reason.icon}
              </span>
              <strong className="block">{reason.title}</strong>
              <p className="text-sm text-muted">{reason.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="places-title" className="space-y-3">
        <h2 id="places-title" className="font-display text-2xl text-brand">
          לאן אפשר להגיע
        </h2>
        <ul className="grid grid-cols-2 gap-2">
          {places.map((place) => (
            <li key={place.name} className={`${cardClassName} space-y-1`}>
              <strong className="font-display text-lg text-accent">{place.name}</strong>
              <p className="text-sm text-muted">{place.text}</p>
            </li>
          ))}
        </ul>
        <div className={`${cardClassName} space-y-1 bg-brand-soft`}>
          <strong className="font-display text-lg text-brand">וגם האוכל</strong>
          <p className="text-sm">
            חצ׳אפורי חם מהתנור, חינקלי עסיסי ועוד הרבה טעמים מקומיים שמיקי יודע איפה עושים הכי טוב.
          </p>
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
        <ol className="space-y-2">
          {steps.map((step, index) => (
            <li key={step} className="flex items-start gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand font-display text-on-brand">
                {index + 1}
              </span>
              <p className="pt-1">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <ReviewsSection />

      <section className={`${cardClassName} space-y-3 text-center`}>
        <h2 className="font-display text-2xl text-brand">מוכנים לגלות את גיאורגיה?</h2>
        <MainActions />
      </section>
    </div>
  )
}

// The next step for whoever is looking: sign up, plan a trip, or go to the guide's board.
function MainActions() {
  const { user } = useAuth()

  if (user?.role === 'GUIDE') {
    return (
      <Link to="/guide" className={`${primaryButtonClassName} block`}>
        ללוח המדריך
      </Link>
    )
  }
  if (user?.role === 'TRAVELER') {
    return (
      <div className="flex gap-3">
        <Link to="/trips/new" className={`${primaryButtonClassName} flex-1`}>
          בקשת טיול חדשה
        </Link>
        <Link to="/trips" className={`${secondaryButtonClassName} flex-1`}>
          הטיולים שלי
        </Link>
      </div>
    )
  }
  return (
    <div className="flex gap-3">
      <Link to="/register" className={`${primaryButtonClassName} flex-1`}>
        בואו נתכנן טיול
      </Link>
      <Link to="/login" className={`${secondaryButtonClassName} flex-1`}>
        כבר יש לי חשבון
      </Link>
    </div>
  )
}

// Mountains at sunset, drawn in the site's colors. A stand-in until there are real photos.
function Scenery() {
  return (
    <svg
      viewBox="0 0 400 160"
      role="img"
      aria-label="איור של הרי הקווקז בשקיעה"
      className="h-auto w-full rounded-2xl bg-brand-soft"
    >
      <circle cx="300" cy="62" r="26" className="fill-ai opacity-70" />
      <path d="M0 160 L0 98 L70 46 L120 86 L185 22 L250 92 L300 64 L400 118 L400 160 Z" className="fill-accent opacity-40" />
      <path d="M185 22 L168 38 L178 36 L186 44 L194 35 L202 39 Z" className="fill-surface" />
      <path d="M0 160 L0 124 L90 82 L160 116 L230 74 L320 120 L400 96 L400 160 Z" className="fill-accent opacity-70" />
      <path d="M0 160 L0 140 L120 118 L240 142 L400 126 L400 160 Z" className="fill-brand" />
    </svg>
  )
}
