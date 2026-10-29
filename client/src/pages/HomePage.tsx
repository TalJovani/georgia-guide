import { type CSSProperties, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { ReviewForm } from '../components/ReviewForm'
import { apiFetch } from '../lib/api'
import type { MyReviews, Review, ReviewsResponse } from '../trips/types'
import './landing.css'

// The landing page, set like an Apple product page: who Miki is, where a trip goes, how it works,
// what travelers say. Everyone sees it, signed in or not; the actions change with who is looking.
// Photographs are real pictures of Georgia from open collections, credited in the footer.

const photo = (file: string) => `/landing/${file}`

// A delay for the nth piece of an entrance, as a CSS custom property the stylesheet reads.
const delay = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties

// In Miki's own voice: the first thing people read after the name.
const statement =
  'אני מיקי. נולדתי וגדלתי בכפר קטן ליד טביליסי. היום אני גר בישראל, אבל הלב שלי נשאר בגיאורגיה, ומדי כמה שבועות אני חוזר אליה, לגלות עוד פינה שרק המקומיים מכירים.'

type Place = { name: string; ka: string; text: string; image: string; alt: string }

// The sideways gallery. Georgian names in their own letters.
const places: Place[] = [
  {
    name: 'טביליסי',
    ka: 'თბილისი',
    text: 'העיר העתיקה, מרחצאות הגופרית וגשר השלום מעל המטקוורי.',
    image: 'tbilisi-panorama-metekhi.jpg',
    alt: 'טביליסי מלמעלה: כנסיית מטחי על הצוק, נהר המטקוורי, מבצר נריקלה וגשר השלום',
  },
  {
    name: 'מצחתה',
    ka: 'მცხეთა',
    text: 'הבירה העתיקה, ומנזר ג׳ווארי מעל מפגש הנהרות.',
    image: 'jvari-monastery-mtskheta-georgia.jpg',
    alt: 'מנזר ג׳ווארי מאבן על גבעה במצחתה',
  },
  {
    name: 'סיגנאגי',
    ka: 'სიღნაღი',
    text: 'עיירת החומות של קאחתי, מעל עמק אלאזני.',
    image: 'view-of-sighnaghi-02.jpg',
    alt: 'גגות אדומים וכנסייה בסיגנאגי, ומאחוריהם עמק אלאזני',
  },
  {
    name: 'קזבגי',
    ka: 'ყაზბეგი',
    text: 'הרי הקווקז, וכנסיית גרגטי מתחת להר קזבק, 5,047 מטר.',
    image: 'kazbegi-mountains-2.jpg',
    alt: 'רכס הרים ירוק ותלול בקזבגי',
  },
  {
    name: 'קאחתי',
    ka: 'კახეთი',
    text: 'ארץ היין: יקבים משפחתיים, ויין שמתיישן בקווברי, כדי חרס בתוך האדמה.',
    image: 'vendanges-en-kakhetie-b.jpg',
    alt: 'ליתוגרפיה משנת 1847: בציר ענבים בכרם בקאחתי',
  },
  {
    name: 'האוכל',
    ka: 'ხაჭაპური',
    text: 'חצ׳אפורי חם מהתנור, וחינקלי שאוכלים בידיים.',
    image: 'tbilisi-khachapuri-and-khinkali-georgian-traditional-food.jpg',
    alt: 'חצ׳אפורי חתוך לרבעים ושני חינקלי על שולחן עץ',
  },
]

type Phrase = { he: string; ka: string; say: string }

// Words Miki says for you. `say` is how it sounds, written in Hebrew letters.
const phraseGroups: { title: string; phrases: Phrase[] }[] = [
  {
    title: 'בשוק',
    phrases: [
      { he: 'שלום', ka: 'გამარჯობა', say: 'גמרג׳ובה' },
      { he: 'כמה זה עולה?', ka: 'რა ღირს?', say: 'רה ע׳ירס?' },
      { he: 'יקר מדי', ka: 'ძალიან ძვირია', say: 'דזליאן דזווירייה' },
      { he: 'יפה מאוד', ka: 'ძალიან ლამაზია', say: 'דזליאן למזיה' },
      { he: 'תודה רבה', ka: 'დიდი მადლობა', say: 'דידי מדלובה' },
      { he: 'להתראות', ka: 'ნახვამდის', say: 'נחוומדיס' },
    ],
  },
  {
    title: 'בשולחן',
    phrases: [
      { he: 'לחיים!', ka: 'გაუმარჯოს!', say: 'גאומרג׳וס!' },
      { he: 'טעים מאוד', ka: 'ძალიან გემრიელია', say: 'דזליאן גמריאליה' },
      { he: 'אני לא אוכל חזיר', ka: 'ღორის ხორცს არ ვჭამ', say: 'ע׳וריס חורצס אר ווצ׳אם' },
      { he: 'יין אדום', ka: 'წითელი ღვინო', say: 'ציתלי ע׳ווינו' },
      { he: 'מים', ka: 'წყალი', say: 'צקאלי' },
      { he: 'חשבון, בבקשה', ka: 'ანგარიში, თუ შეიძლება', say: 'אנגרישי, תו שאידזלבה' },
    ],
  },
  {
    title: 'בדרך',
    phrases: [
      { he: 'איפה השירותים?', ka: 'სად არის ტუალეტი?', say: 'סד אריס טואלטי?' },
      { he: 'זה רחוק?', ka: 'შორსაა?', say: 'שורסאא?' },
      { he: 'ימינה', ka: 'მარჯვნივ', say: 'מרג׳וניב' },
      { he: 'שמאלה', ka: 'მარცხნივ', say: 'מרצחניב' },
      { he: 'עצרו כאן, בבקשה', ka: 'აქ გააჩერეთ, თუ შეიძლება', say: 'אק גאצ׳רת, תו שאידזלבה' },
      { he: 'כן / לא', ka: 'კი / არა', say: 'קי / ארה' },
    ],
  },
]

// How a trip happens, with the photograph that stays beside each step.
const steps = [
  {
    title: 'קודם, אתם מספרים.',
    text: 'מתי אתם רוצים לטוס, כמה אתם, מה התקציב, ומה אתם הכי אוהבים: יין, הרים, שווקים או אוכל טוב.',
    image: 'tbilisi-khachapuri-and-khinkali-georgian-traditional-food.jpg',
    alt: 'חצ׳אפורי וחינקלי על שולחן עץ בטביליסי',
  },
  {
    title: 'אחר כך, מסלול.',
    text: 'מיקי בונה לכם מסלול אישי, יום אחרי יום ושעה אחרי שעה. משנים ומדייקים יחד, עד שהוא בדיוק כמו שרציתם.',
    image: 'tbilisi-legvtakhevi-waterfall.jpg',
    alt: 'מפל לגבתח׳בי וגשר לבן בין עצים ירוקים, בלב העיר העתיקה של טביליסי',
  },
  {
    title: 'ובזמן הטיול, מיקי איתכם.',
    text: 'בטלפון ובצ׳אט, בזמן אמת: לאן נוסעים עכשיו, מה מזמינים, ומה עושים אם משהו משתנה.',
    image: 'tbilisi-old-town-night-street.jpg',
    alt: 'רחוב מסעדות מואר בטביליסי העתיקה בלילה, שולחנות בחוץ ושרשראות אורות',
  },
]

// Every picture on the page, credited as its licence asks.
const credits = [
  { what: 'כנסיית השילוש בגרגטי', by: 'Vyacheslav Argenberg', licence: 'CC BY 4.0', page: 'https://commons.wikimedia.org/w/index.php?curid=116990360', licenceUrl: 'https://creativecommons.org/licenses/by/4.0/' },
  { what: 'טביליסי בלילה', by: 'Boris Kuznetsov', licence: 'CC BY 2.0', page: 'https://commons.wikimedia.org/wiki/File:Tbilisi_at_Night,_Georgia.jpg', licenceUrl: 'https://creativecommons.org/licenses/by/2.0/' },
  { what: 'אושגולי והר שחרה', by: 'Arian Zwegers', licence: 'CC BY 2.0', page: 'https://commons.wikimedia.org/wiki/File:Ushguli_and_Mt_Shkhara_(35923023802).jpg', licenceUrl: 'https://creativecommons.org/licenses/by/2.0/' },
  { what: 'מנזר ג׳ווארי', by: 'falco', licence: 'CC0', page: 'https://commons.wikimedia.org/w/index.php?curid=105104108', licenceUrl: 'https://creativecommons.org/publicdomain/zero/1.0/' },
  { what: 'סיגנאגי', by: 'Bernard Gagnon', licence: 'CC BY 4.0', page: 'https://commons.wikimedia.org/wiki/File:View_of_Sighnaghi_02.jpg', licenceUrl: 'https://creativecommons.org/licenses/by/4.0/' },
  { what: 'הרי קזבגי', by: 'Sandromedia123', licence: 'CC0', page: 'https://commons.wikimedia.org/w/index.php?curid=188463559', licenceUrl: 'https://creativecommons.org/publicdomain/zero/1.0/' },
  { what: 'בציר בקאחתי, 1847', by: 'Grigory Gagarin', licence: 'נחלת הכלל', page: 'https://commons.wikimedia.org/wiki/File:Vendanges_en_Kakhetie_(B).jpg', licenceUrl: 'https://creativecommons.org/publicdomain/mark/1.0/' },
  { what: 'חצ׳אפורי וחינקלי', by: 'Vyacheslav Argenberg', licence: 'CC BY 4.0', page: 'https://commons.wikimedia.org/wiki/File:Tbilisi,_Khachapuri_and_khinkali,_Georgian_traditional_food,_Georgia.jpg', licenceUrl: 'https://creativecommons.org/licenses/by/4.0/' },
]

// Sections rise into place as they scroll in. The hidden starting state only applies once
// `is-live` is on, so nothing stays hidden if this never runs. Parts that appear later (the
// reviews arrive from the server after the page) are picked up as they are added.
function useReveal() {
  const root = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = root.current
    if (!el || !('IntersectionObserver' in window)) return
    el.classList.add('is-live')
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in')
            observer.unobserve(entry.target)
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    )
    const watch = (node: ParentNode) =>
      node.querySelectorAll('[data-reveal]:not(.is-in)').forEach((target) => observer.observe(target))
    watch(el)
    const added = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return
          if (node.matches('[data-reveal]')) observer.observe(node)
          watch(node)
        })
      }
    })
    added.observe(el, { childList: true, subtree: true })
    return () => {
      observer.disconnect()
      added.disconnect()
    }
  }, [])

  return root
}

// The statement's words turn from grey to ink as it moves up the screen, as if being read.
// Classes are set straight on the spans, once per animation frame: no React render per scroll.
function useInkFill() {
  const ref = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const words = [...el.querySelectorAll<HTMLElement>('.ap-word')]
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      words.forEach((word) => word.classList.add('is-lit'))
      return
    }
    let frame = 0
    const paint = () => {
      frame = 0
      const box = el.getBoundingClientRect()
      const view = window.innerHeight
      const progress = Math.min(1, Math.max(0, (view * 0.85 - box.top) / (box.height + view * 0.35)))
      const lit = Math.round(progress * words.length)
      words.forEach((word, index) => word.classList.toggle('is-lit', index < lit))
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(paint)
    }
    paint()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  return ref
}

export function HomePage() {
  const root = useReveal()

  return (
    <div ref={root} className="ap">
      <ProductBar />

      <header className="ap-hero">
        <div className="ap-wrap">
          <p className="ap-hero__eyebrow" data-load style={delay(0)}>
            טיולים פרטיים בגיאורגיה
          </p>
          {/* The name, cut out of the Caucasus: the letters are a window onto the mountains.
              On a phone the two words stack, so each can be set large. */}
          <h1 className="ap-brand" dir="ltr" data-load style={delay(120)}>
            <span>Georgia</span> <span>Trips</span>
          </h1>
          <p className="ap-intro ap-hero__sub" data-load style={delay(320)}>
             טיול אישי מרחוק עם מיקי, מדריך מקומי שנולד בגיאורגיה ומכיר כל פינה.
          </p>
          <div className="ap-actions" data-load style={delay(380)}>
            <PrimaryAction />
            <a href="#how" className="ap-pill ap-pill--quiet">
              איך זה עובד
            </a>
          </div>
        </div>
        <figure className="ap-hero__media">
          <img
            src={photo('hero-gergeti.jpg')}
            width={2400}
            height={1595}
            fetchPriority="high"
            alt="כנסיית השילוש בגרגטי על גבעה ירוקה מתחת לשמיים כחולים ועננים"
          />
        </figure>
      </header>

      <Statement />

      <section id="miki" aria-labelledby="miki-title" className="ap-chapter ap-chapter--alt">
        <div className="ap-wrap">
          <div className="ap-chapter__head">
            <h2 id="miki-title" className="ap-headline" data-reveal>
              נעים להכיר, מיקי.
            </h2>
            <p className="ap-intro" data-reveal style={delay(100)}>
              סבלני, קשוב והרפתקן, ועדיין מתרגש מכל טיול מחדש.
            </p>
          </div>
          <div className="ap-bento">
            <figure className="ap-card ap-card--3 ap-card--photo" data-reveal>
              <img
                src={photo('ushguli-shkhara.jpg')}
                width={1600}
                height={1066}
                decoding="async"
                alt="הכפר אושגולי בסבנטי, מגדלי אבן עתיקים בעמק ירוק, ומעליו פסגת השחרה המושלגת"
              />
              <figcaption className="ap-card__over">
                <p className="ap-card__title">אושגולי, סבנטי.</p>
                <p className="ap-card__text">מגדלי אבן בני מאות שנים, מתחת להר הגבוה בגיאורגיה.</p>
              </figcaption>
            </figure>
            <figure className="ap-card ap-card--3 ap-card--photo" data-reveal style={delay(80)}>
              <img
                src={photo('tbilisi-mtatsminda-sunset.jpg')}
                width={800}
                height={530}
                decoding="async"
                alt="שקיעה מעל טביליסי, מפארק מטצמינדה עם הגלגל הענק ומגדל הטלוויזיה"
              />
              <figcaption className="ap-card__over">
                <p className="ap-card__title">הבית של מיקי.</p>
                <p className="ap-card__text">טביליסי בשקיעה. מיקי גדל בכפר קטן לא רחוק מכאן.</p>
              </figcaption>
            </figure>
            <div className="ap-card ap-card--2" data-reveal>
              <p className="ap-card__big ap-card__big--mid">שוב ושוב</p>
              <p className="ap-card__text">מיקי חוזר לגיאורגיה כל כמה שבועות, אז הוא תמיד מעודכן.</p>
            </div>
            <div className="ap-card ap-card--2" data-reveal style={delay(80)}>
              <p className="ap-card__big ap-card__big--mid">2.5 שעות</p>
              <p className="ap-card__text">בערך, בטיסה ישירה מתל אביב לטביליסי.</p>
            </div>
            <div className="ap-card ap-card--2" data-reveal style={delay(160)}>
              <p className="ap-card__big ap-card__big--mid">כל כשרות</p>
              <p className="ap-card__text">מסעדות שמתאימות בדיוק, מכשר־סטייל ועד מהדרין.</p>
            </div>
            <div className="ap-card ap-card--3" data-reveal>
              <p className="ap-card__title">קודם כול, הקשבה.</p>
              <p className="ap-card__text">
                מיקי מכיר אתכם, מה אתם אוהבים ובאיזה קצב, ומתאים את הטיול כך שכולם ירגישו בנוח, גם הילדים.
                ממש כמו משפחה.
              </p>
            </div>
            <div className="ap-card ap-card--3" data-reveal style={delay(80)}>
              <p className="ap-card__title">בלי פערי תיווך.</p>
              <p className="ap-card__text">
                מיקי מכיר את המחירים המקומיים, אז תקבלו תמורה מצוינת לכסף. וצריכים רכב? מיקי ידאג לרכב שכור.
              </p>
            </div>
            <blockquote className="ap-card ap-card--6 ap-card--quote" data-reveal>
              <p className="ap-card__title">
                "בשבילי, להדריך בגיאורגיה זה הרבה יותר מעבודה. זו הזדמנות לחלוק איתכם את הבית שלי."
              </p>
              <footer className="ap-card__text">מיקי</footer>
            </blockquote>
          </div>
        </div>
      </section>

      <Places />

      <section aria-labelledby="night-title" className="ap-night">
        <div className="ap-wrap">
          <h2 id="night-title" className="ap-headline" data-reveal>
            טביליסי, אחרי השקיעה.
          </h2>
          <p className="ap-intro" data-reveal style={delay(100)}>
            העיר העתיקה נדלקת, קתדרלת סמבה זוהרת על הגבעה, ומיקי יודע איפה יושבים לארוחת ערב.
          </p>
        </div>
        <figure className="ap-night__media">
          <img
            src={photo('tbilisi-night.jpg')}
            width={2400}
            height={1357}
            decoding="async"
            alt="טביליסי בלילה מלמעלה: אורות העיר, הנהר, גשר השלום וקתדרלת סמבה המוארת"
          />
        </figure>
      </section>

      <Phrasebook />

      <HowItWorks />

      <Voices />

      <section aria-labelledby="close-title" className="ap-chapter ap-close">
        <div className="ap-wrap">
          <h2 id="close-title" className="ap-headline" data-reveal>
            מוכנים לגיאורגיה?
          </h2>
          <p className="ap-intro" data-reveal style={delay(100)}>
            "המטרה שלי פשוטה: שלא רק תראו את גיאורגיה, אלא תכירו, תרגישו ותתאהבו בה. בדיוק כמוני." ❤️
          </p>
          <div className="ap-actions" data-reveal style={delay(200)}>
            <PrimaryAction />
            <SecondaryLink />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

// The bar on top: the name, the chapters, one small blue pill. Frosted, and it stays.
function ProductBar() {
  const { user } = useAuth()

  return (
    <nav className="ap-nav" aria-label="ראשי">
      <div className="ap-wrap ap-nav__row">
        <Link to="/" className="ap-nav__name" dir="ltr">
          Georgia Trips
        </Link>
        <div className="ap-nav__links">
          <a href="#miki">קצת עליי</a>
          <a href="#places">מקומות</a>
          <a href="#how">איך זה עובד</a>
          {user ? <Link to="/account">החשבון שלי</Link> : <Link to="/login">כניסה</Link>}
        </div>
        <PrimaryAction small />
      </div>
    </nav>
  )
}

// The one thing to do next, named for whoever is looking.
function PrimaryAction({ small = false }: { small?: boolean }) {
  const { user } = useAuth()
  const [to, label] =
    user?.role === 'GUIDE'
      ? ['/guide', 'ללוח המדריך']
      : user?.role === 'TRAVELER'
        ? ['/trips/new', 'בקשת טיול חדשה']
        : ['/register', 'בואו נתכנן טיול']

  return (
    <Link to={to} className={small ? 'ap-pill ap-pill--small' : 'ap-pill'}>
      {label}
    </Link>
  )
}

// The second choice, as a plain blue text link.
function SecondaryLink() {
  const { user } = useAuth()
  if (user?.role === 'GUIDE') return null
  return user ? (
    <Link to="/trips" className="ap-more">
      הטיולים שלי
    </Link>
  ) : (
    <Link to="/login" className="ap-more">
      כבר יש לי חשבון
    </Link>
  )
}

function Statement() {
  const ref = useInkFill()
  return (
    <section aria-label="על מיקי" className="ap-statement">
      <div className="ap-wrap">
        <p ref={ref}>
          {statement.split(' ').map((word, index) => (
            <span key={index} className="ap-word">
              {word}{' '}
            </span>
          ))}
        </p>
      </div>
    </section>
  )
}

// Places: a sideways gallery of tall cards. The round buttons move it one card at a time.
function Places() {
  const track = useRef<HTMLUListElement>(null)

  // In a right-to-left page, going forward means scrolling toward the left.
  function move(direction: 1 | -1) {
    const el = track.current
    const card = el?.firstElementChild as HTMLElement | null
    if (!el || !card) return
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0
    el.scrollBy({ left: -direction * (card.offsetWidth + gap), behavior: 'smooth' })
  }

  return (
    <section id="places" aria-labelledby="places-title" className="ap-chapter">
      <div className="ap-wrap ap-chapter__head">
        <h2 id="places-title" className="ap-headline" data-reveal>
          מטביליסי, לכל כיוון.
        </h2>
        <p className="ap-intro" data-reveal style={delay(100)}>
          עיר, הרים, יין ואוכל. ועוד הרבה פינות שרק מקומיים מכירים.
        </p>
      </div>
      <ul ref={track} className="ap-gallery" aria-label="מקומות">
        {places.map((place, index) => (
          <li key={place.name} className="ap-place" data-reveal style={delay(index * 70)}>
            <img src={photo(place.image)} alt={place.alt} decoding="async" />
            <div className="ap-place__text">
              <span className="ap-place__ka ap-ka" lang="ka" dir="ltr">
                {place.ka}
              </span>
              <span className="ap-place__name">{place.name}</span>
              <span className="ap-place__line">{place.text}</span>
            </div>
          </li>
        ))}
      </ul>
      <div className="ap-wrap ap-gallery__controls">
        <button type="button" className="ap-round" aria-label="המקום הקודם" onClick={() => move(-1)}>
          ‹
        </button>
        <button type="button" className="ap-round" aria-label="המקום הבא" onClick={() => move(1)}>
          ›
        </button>
      </div>
    </section>
  )
}

// The one live thing: pick a group, tap a Hebrew phrase, see it in Georgian and how it sounds.
function Phrasebook() {
  const [group, setGroup] = useState(1)
  const [shown, setShown] = useState<Phrase>(phraseGroups[1].phrases[0])

  function pickGroup(index: number) {
    setGroup(index)
    setShown(phraseGroups[index].phrases[0])
  }

  return (
    <section aria-labelledby="say-title" className="ap-chapter ap-chapter--alt">
      <div className="ap-wrap">
        <div className="ap-chapter__head">
          <h2 id="say-title" className="ap-headline" data-reveal>
           כמה מילים בגיאורגית שיעזרו לכם..
          </h2>
          <p className="ap-intro" data-reveal style={delay(100)}>
            במסעדה, ברחוב או סתם בדרך למלון 😊
            <br />
            בחרנו עבורכם את המילים הכי שימושיות ליום יום בגיאורגיה
          </p>
        </div>
        <div className="ap-say" data-reveal>
          <div>
            <div className="ap-segment" role="group" aria-label="איפה">
              {phraseGroups.map((item, index) => (
                <button
                  key={item.title}
                  type="button"
                  aria-pressed={index === group}
                  onClick={() => pickGroup(index)}
                >
                  {item.title}
                </button>
              ))}
            </div>
            <div className="ap-chips">
              {phraseGroups[group].phrases.map((phrase) => (
                <button
                  key={phrase.he}
                  type="button"
                  className="ap-chip"
                  aria-pressed={phrase === shown}
                  onClick={() => setShown(phrase)}
                >
                  {phrase.he}
                </button>
              ))}
            </div>
          </div>
          <p className="ap-say__shown" aria-live="polite">
            <span key={shown.ka} className="ap-say__ka ap-ka" lang="ka" dir="ltr">
              {shown.ka}
            </span>
            <span key={shown.say} className="ap-say__sound">
              {shown.say}
            </span>
            <span className="ap-say__he">{shown.he}</span>
          </p>
        </div>
      </div>
    </section>
  )
}

// How it works: the steps scroll past; the photograph beside them stays and changes with the step
// in the middle of the screen. On a phone each step carries its own photograph instead.
function HowItWorks() {
  const [active, setActive] = useState(0)
  const list = useRef<HTMLOListElement>(null)

  useEffect(() => {
    const el = list.current
    if (!el || !('IntersectionObserver' in window)) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.step))
        }
      },
      { rootMargin: '-45% 0px -45% 0px' },
    )
    el.querySelectorAll('[data-step]').forEach((step) => observer.observe(step))
    return () => observer.disconnect()
  }, [])

  return (
    <section id="how" aria-labelledby="how-title" className="ap-chapter">
      <div className="ap-wrap">
        <div className="ap-chapter__head">
          <h2 id="how-title" className="ap-headline" data-reveal>
            איך זה עובד.
          </h2>
        </div>
        <div className="ap-how">
          <ol ref={list} className="ap-how__steps">
            {steps.map((step, index) => (
              <li
                key={step.title}
                data-step={index}
                className={`ap-step ${index === active ? 'is-active' : ''}`}
              >
                <div className="ap-step__phone">
                  <img src={photo(step.image)} alt={step.alt} decoding="async" />
                </div>
                <h3 className="ap-step__title">{step.title}</h3>
                <p className="ap-intro">{step.text}</p>
              </li>
            ))}
          </ol>
          <div className="ap-how__stage" aria-hidden="true">
            {steps.map((step, index) => (
              <img
                key={step.title}
                src={photo(step.image)}
                alt=""
                decoding="async"
                className={index === active ? 'is-active' : ''}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// What travelers say: the newest review with words. A signed-in traveler who hasn't written a
// general review yet can add one here.
function Voices() {
  const { user } = useAuth()
  const [data, setData] = useState<ReviewsResponse | null>(null)
  const [canWrite, setCanWrite] = useState(false)
  const [writing, setWriting] = useState(false)

  useEffect(() => {
    apiFetch<ReviewsResponse>('/api/reviews')
      .then(setData)
      .catch(() => setData({ reviews: [], average: null, count: 0 }))
  }, [])

  useEffect(() => {
    if (user?.role !== 'TRAVELER') return
    apiFetch<MyReviews>('/api/reviews/mine')
      .then((mine) => setCanWrite(!mine.hasGeneralReview))
      .catch(() => {})
  }, [user])

  function addReview(review: Review) {
    setData((prev) =>
      prev && {
        reviews: [review, ...prev.reviews],
        count: prev.count + 1,
        average: ((prev.average ?? 0) * prev.count + review.rating) / (prev.count + 1),
      },
    )
    setCanWrite(false)
    setWriting(false)
  }

  if (!data) return null
  const quote = data.reviews.find((review) => review.text)
  const canAdd = user?.role === 'TRAVELER' && canWrite
  if (!quote && !canAdd) return null

  const count = data.count === 1 ? 'ביקורת אחת' : `${data.count} ביקורות`
  const stars = data.average === null ? 0 : Math.round(data.average)

  return (
    <section id="voices" aria-labelledby="voices-title" className="ap-chapter ap-chapter--alt ap-voice">
      <div className="ap-wrap">
        <div className="ap-chapter__head">
          <h2 id="voices-title" className="ap-headline" data-reveal>
            מה אומרים המטיילים.
          </h2>
          {data.average !== null && (
            <p className="ap-intro" data-reveal style={delay(100)}>
              <span className="ap-voice__stars" aria-hidden="true">
                {'★'.repeat(stars)}
              </span>{' '}
              {/* One decimal only when it says something: 5, but 4.5. */}
              {Number(data.average.toFixed(1))} מתוך 5, לפי {count}
            </p>
          )}
        </div>
        {quote ? (
          <>
            <blockquote className="ap-voice__quote" data-reveal>
              “{quote.text}”
            </blockquote>
            <p className="ap-voice__who" data-reveal style={delay(100)}>
              {quote.authorName}
              {quote.verifiedTrip && ', טיול מאומת'}
            </p>
          </>
        ) : (
          <p className="ap-intro">עוד אין ביקורות. אתם יכולים להיות הראשונים.</p>
        )}
        {canAdd &&
          (writing ? (
            <div className="ap-voice__form rounded-xl bg-surface p-4 text-ink">
              <ReviewForm question="מה דעתכם על Georgia Trips?" onSent={addReview} />
            </div>
          ) : (
            <div className="ap-voice__write">
              <button type="button" className="ap-more" onClick={() => setWriting(true)}>
                טיילתם עם מיקי? כתבו מה אתם חושבים
              </button>
            </div>
          ))}
      </div>
    </section>
  )
}

function Footer() {
  const { user } = useAuth()

  return (
    <footer className="ap-foot">
      <div className="ap-wrap">
        {/* Back to the start. Glides there, unless the visitor asked for less motion (see `html`). */}
        <div className="ap-foot__top">
          <button type="button" className="ap-pill ap-pill--quiet" onClick={() => window.scrollTo({ top: 0 })}>
            חזרה למעלה ↑
          </button>
        </div>
        <p className="ap-foot__credits">
          התמונות מוויקישיתוף:{' '}
          {credits.map((credit, index) => (
            <span key={credit.page}>
              <a href={credit.page}>{credit.what}</a>, <span dir="ltr">{credit.by}</span>,{' '}
              <a href={credit.licenceUrl}>{credit.licence}</a>
              {index < credits.length - 1 ? '; ' : '.'}
            </span>
          ))}
        </p>
        <div className="ap-foot__row">
          <p>© 2026 Georgia Trips. טיולים פרטיים בגיאורגיה, עם מיקי.</p>
          <nav className="ap-foot__links" aria-label="קישורים">
            {user ? (
              <Link to={user.role === 'GUIDE' ? '/guide' : '/trips'}>
                {user.role === 'GUIDE' ? 'לוח המדריך' : 'הטיולים שלי'}
              </Link>
            ) : (
              <>
                <Link to="/register">הרשמה</Link>
                <Link to="/login">כניסה</Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </footer>
  )
}
