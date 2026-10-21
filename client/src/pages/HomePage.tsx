import { type CSSProperties, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { ReviewForm } from '../components/ReviewForm'
import { apiFetch } from '../lib/api'
import type { MyReviews, Review, ReviewsResponse } from '../trips/types'
import './landing.css'

// The landing page: who Miki is, where a trip goes, how it works, what travelers say.
// Everyone sees it, signed in or not; the actions change with who is looking.
// Photographs are real pictures of Georgia from open collections, credited in the footer.

const photo = (file: string) => `/landing/${file}`

// A delay for the nth piece of an entrance, as a CSS custom property the stylesheet reads.
const delay = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties

type Place = { kind: string; name: string; ka: string; text: string }

// Grouped like a timetable: towns, mountains, then wine and food. Georgian names in their own letters.
const placeGroups: Place[][] = [
  [
    { kind: 'עיר', name: 'טביליסי', ka: 'თბილისი', text: 'העיר העתיקה, מרחצאות הגופרית והמרפסות המגולפות' },
    { kind: 'עיר', name: 'מצחתה', ka: 'მცხეთა', text: 'הבירה העתיקה, ומנזר ג׳ווארי מעל מפגש הנהרות' },
    { kind: 'עיירה', name: 'סיגנאגי', ka: 'სიღნაღი', text: 'עיירת החומות של קאחתי, מעל עמק אלאזני' },
  ],
  [
    { kind: 'הרים', name: 'קזבגי', ka: 'ყაზბეგი', text: 'כנסיית גרגטי מתחת להר קזבק, 5,047 מטר' },
    { kind: 'מבצר', name: 'אנאנורי', ka: 'ანანური', text: 'מבצר על אגם ז׳ינוואלי, בדרך הצבאית אל ההרים' },
  ],
  [
    { kind: 'יין', name: 'קאחתי', ka: 'კახეთი', text: 'יקבים משפחתיים, ויין שמתיישן בקווברי, כדי חרס בתוך האדמה' },
    { kind: 'מאפה', name: 'חצ׳אפורי', ka: 'ხაჭაპური', text: 'לחם גבינה חם, ישר מהתנור' },
    { kind: 'מנה', name: 'חינקלי', ka: 'ხინკალი', text: 'כיסונים עסיסיים, שאוכלים בידיים' },
  ],
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

// Every picture on the page, credited as its licence asks.
const credits = [
  { what: 'כנסיית השילוש בגרגטי', by: 'Vyacheslav Argenberg', licence: 'CC BY 4.0', page: 'https://commons.wikimedia.org/w/index.php?curid=116990360', licenceUrl: 'https://creativecommons.org/licenses/by/4.0/' },
  { what: 'אבנוטובאני, טביליסי', by: 'Supanut Arunoprayote', licence: 'CC BY 4.0', page: 'https://commons.wikimedia.org/w/index.php?curid=149896952', licenceUrl: 'https://creativecommons.org/licenses/by/4.0/' },
  { what: 'טביליסי, תחילת המאה ה־20', by: 'Sergei Prokudin-Gorskii', licence: 'נחלת הכלל', page: 'https://commons.wikimedia.org/wiki/File:View_of_Havlabar_(Tbilisi),_in_the_early_1900s,_Sergei_Mikhailovich_Prokudin-Gorskii.jpg', licenceUrl: 'https://creativecommons.org/publicdomain/mark/1.0/' },
  { what: 'מרפסות בטביליסי', by: 'Morten Oddvik', licence: 'CC BY 2.0', page: 'https://commons.wikimedia.org/w/index.php?curid=3353286', licenceUrl: 'https://creativecommons.org/licenses/by/2.0/' },
  { what: 'חצ׳אפורי וחינקלי', by: 'Vyacheslav Argenberg', licence: 'CC BY 4.0', page: 'https://commons.wikimedia.org/wiki/File:Tbilisi,_Khachapuri_and_khinkali,_Georgian_traditional_food,_Georgia.jpg', licenceUrl: 'https://creativecommons.org/licenses/by/4.0/' },
  { what: 'מנזר ג׳ווארי', by: 'falco', licence: 'CC0', page: 'https://commons.wikimedia.org/w/index.php?curid=105104108', licenceUrl: 'https://creativecommons.org/publicdomain/zero/1.0/' },
  { what: 'סיגנאגי', by: 'Bernard Gagnon', licence: 'CC BY 4.0', page: 'https://commons.wikimedia.org/wiki/File:View_of_Sighnaghi_02.jpg', licenceUrl: 'https://creativecommons.org/licenses/by/4.0/' },
  { what: 'הרי קזבגי', by: 'Sandromedia123', licence: 'CC0', page: 'https://commons.wikimedia.org/w/index.php?curid=188463559', licenceUrl: 'https://creativecommons.org/publicdomain/zero/1.0/' },
  { what: 'בציר בקאחתי, 1847', by: 'Grigory Gagarin', licence: 'נחלת הכלל', page: 'https://commons.wikimedia.org/wiki/File:Vendanges_en_Kakhetie_(B).jpg', licenceUrl: 'https://creativecommons.org/publicdomain/mark/1.0/' },
]

// Sections rise into place as they scroll in; photographs open like a shutter.
// The hidden starting state only applies once `is-live` is on, so nothing stays hidden without this.
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
      // Start a little before the element enters, so a fast scroll never lands on an empty frame.
      { rootMargin: '0px 0px 10% 0px' },
    )
    el.querySelectorAll('[data-reveal], [data-shutter]').forEach((target) => observer.observe(target))
    return () => observer.disconnect()
  }, [])

  return root
}

// Depth: while the mouse moves over the hero, the view inside the small photograph shifts a few
// pixels the other way, like looking through a window. A spring follows the mouse instead of
// jumping to it, so the picture has weight. Mouse only, and never when less motion is asked for.
// The transform is written straight to the element: no React state, no re-render per frame.
function useWindowDepth() {
  const area = useRef<HTMLElement>(null)
  const layer = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const zone = area.current
    const el = layer.current
    if (!zone || !el) return
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const target = { x: 0, y: 0 }
    const pos = { x: 0, y: 0 }
    const speed = { x: 0, y: 0 }
    let frame = 0

    // A damped spring: pulled toward the target, slowed by friction, stopped when it has settled.
    const step = () => {
      for (const axis of ['x', 'y'] as const) {
        speed[axis] = (speed[axis] + (target[axis] - pos[axis]) * 0.06) * 0.82
        pos[axis] += speed[axis]
      }
      el.style.transform = `translate3d(${pos.x.toFixed(2)}px, ${pos.y.toFixed(2)}px, 0)`
      const moving =
        Math.abs(speed.x) + Math.abs(speed.y) > 0.01 ||
        Math.abs(target.x - pos.x) + Math.abs(target.y - pos.y) > 0.05
      frame = moving ? requestAnimationFrame(step) : 0
    }
    const kick = () => {
      if (!frame) frame = requestAnimationFrame(step)
    }

    const onMove = (event: PointerEvent) => {
      const box = el.getBoundingClientRect()
      const nx = (event.clientX - (box.left + box.width / 2)) / (window.innerWidth / 2)
      const ny = (event.clientY - (box.top + box.height / 2)) / (window.innerHeight / 2)
      target.x = Math.max(-1, Math.min(1, nx)) * -12
      target.y = Math.max(-1, Math.min(1, ny)) * -9
      kick()
    }
    const onLeave = () => {
      target.x = 0
      target.y = 0
      kick()
    }

    zone.addEventListener('pointermove', onMove)
    zone.addEventListener('pointerleave', onLeave)
    return () => {
      zone.removeEventListener('pointermove', onMove)
      zone.removeEventListener('pointerleave', onLeave)
      cancelAnimationFrame(frame)
    }
  }, [])

  return [area, layer] as const
}

export function HomePage() {
  const root = useReveal()
  const [depthArea, depthLayer] = useWindowDepth()

  return (
    <div ref={root} className="lp">
      <LandingNav />

      <header ref={depthArea} className="lp-grid lp-hero">
        {/* Three layers, one motion each: the mouse spring, the slow breath, the load settle. */}
        <figure className="lp-hero__small lp-alive" data-open style={delay(350)}>
          <div ref={depthLayer} className="lp-alive__depth">
            <div className="lp-alive__breath">
              <img
                src={photo('abanotubani-tbilisi-20230921.jpg')}
                width={1440}
                height={960}
                alt="בתים צבעוניים עם מרפסות עץ מעל קשתות האבן של אבנוטובאני, טביליסי"
              />
            </div>
          </div>
          <figcaption className="lp-alive__caption" aria-hidden="true">
            <span className="lp-ka" lang="ka" dir="ltr">
              აბანოთუბანი
            </span>
            אבנוטובאני, טביליסי
          </figcaption>
        </figure>
        <h1 className="lp-hero__title">
          <span className="lp-line lp-hero__line1">
            <span data-line style={{ '--i': 0 } as CSSProperties}>
              גיאורגיה,
            </span>
          </span>
          <span className="lp-line lp-hero__line2">
            <span data-line style={{ '--i': 1 } as CSSProperties}>
              בעברית.
            </span>
          </span>
        </h1>
        <figure className="lp-hero__tall" data-open style={delay(150)}>
          <img
            src={photo('gergeti-trinity-church-georgia.jpg')}
            width={1440}
            height={957}
            style={{ objectPosition: '46% center' }}
            alt="כנסיית השילוש בגרגטי על גבעה ירוקה מתחת לשמיים כחולים"
          />
        </figure>
        <div className="lp-hero__text" data-load style={delay(650)}>
          <p>
            מיקי נולד בגיאורגיה ומדבר עברית. הוא בונה לכם טיול אישי, יום אחרי יום, ומלווה אתכם בטלפון
            לאורך כל הדרך.
          </p>
          <MainActions />
        </div>
      </header>

      <section aria-labelledby="miki-title" className="lp-grid lp-intro">
        <h2 id="miki-title" className="lp-intro__head" data-reveal>
          נעים להכיר, מיקי
        </h2>
        <p className="lp-intro__note" data-reveal style={delay(80)}>
          הכול התחיל מרעיון פשוט: להראות לאנשים את גיאורגיה של המקומיים. מיקי סבלני, קשוב והרפתקן,
          והוא עדיין מתרגש מכל טיול מחדש.
        </p>
        <ul className="lp-facts" aria-label="מיקי במספרים">
          {[
            { big: '3 שפות', small: 'עברית, אנגלית וגיאורגית' },
            { big: 'כל חודש', small: 'מיקי טס לגיאורגיה כמעט כל חודש' },
            { big: 'כשעתיים וחצי', small: 'טיסה ישירה מתל אביב לטביליסי' },
            { big: 'כל רמת כשרות', small: 'מכשר־סטייל ועד מהדרין' },
          ].map((fact, index) => (
            <li key={fact.big} data-reveal style={delay(index * 70)}>
              <strong>{fact.big}</strong>
              <span>{fact.small}</span>
            </li>
          ))}
        </ul>
        <p className="lp-intro__aside" data-reveal>
          הטיול מתאים גם למשפחות עם ילדים, ואם צריך, מיקי דואג לרכב שכור. ובלי פערי תיווך של חברת
          טיולים גדולה, מקבלים יותר טיול על אותו תקציב.
        </p>
        <figure className="lp-intro__photo">
          <div className="lp-frame" data-shutter>
            <img
              src={photo('view-of-havlabar-tbilisi-in-the-early.jpg')}
              width={1440}
              height={1251}
              decoding="async"
              alt="טביליסי מלמעלה, בתים וכנסיות על צוק מעל הנהר, בצילום צבע ישן"
            />
          </div>
          <figcaption className="lp-caption">
            טביליסי, העיר שמיקי גדל בה, בצילום צבע של סרגיי פרוקודין־גורסקי מתחילת המאה ה־20.
          </figcaption>
        </figure>
      </section>

      <section aria-labelledby="places-title" className="lp-grid lp-places">
        <h2 id="places-title" className="lp-places__head" data-reveal>
          מטביליסי,
          <br />
          לכל כיוון שתרצו
        </h2>
        <figure className="lp-places__photo">
          <div className="lp-frame" data-shutter>
            <img
              src={photo('balconies-of-tbilisi.jpg')}
              width={1440}
              height={958}
              decoding="async"
              style={{ objectPosition: '30% center' }}
              alt="מעקה עץ מגולף של מרפסת בטביליסי, בירוק בהיר"
            />
          </div>
        </figure>
        <p className="lp-places__label" aria-hidden="true">
          מקומות
        </p>
        <table className="lp-places__table">
          <caption className="sr-only">מקומות שמיקי לוקח אליהם, עם השם שלהם בגיאורגית</caption>
          {placeGroups.map((group, groupIndex) => (
            <tbody key={groupIndex}>
              {group.map((place) => (
                <tr key={place.name} data-reveal>
                  <td className="lp-kind">{place.kind}</td>
                  <td className="lp-place">
                    <strong>{place.name}</strong>
                    <span>{place.text}</span>
                  </td>
                  <td className="lp-ka" lang="ka" dir="ltr">
                    {place.ka}
                  </td>
                </tr>
              ))}
            </tbody>
          ))}
        </table>
        <p className="lp-places__more" data-reveal>
          ועוד אגמים, מנזרים חצובים בסלע ופינות שרק מקומיים מכירים. ספרו למיקי מה אתם אוהבים, והוא כבר
          יידע לאן לקחת אתכם.
        </p>
      </section>

      <Phrasebook />

      <section aria-labelledby="how-title" className="lp-grid lp-how">
        <h2 id="how-title" className="lp-how__head" data-reveal>
          איך זה עובד
        </h2>
        <ol className="lp-stage">
          <li className="lp-stage">
            <div className="lp-frame lp-stage__photo--1" data-shutter>
              <img
                src={photo('tbilisi-khachapuri-and-khinkali-georgian-traditional-food.jpg')}
                width={1440}
                height={957}
                decoding="async"
                style={{ objectPosition: '38% 70%' }}
                alt="חצ׳אפורי חתוך לרבעים ושני חינקלי על שולחן עץ בטביליסי"
              />
            </div>
            <p className="lp-stage__text--1" data-reveal>
              <b>קודם, אתם מספרים.</b> מתי אתם רוצים לטוס, כמה אתם, מה התקציב, ומה אתם הכי אוהבים: יין,
              הרים, שווקים או אוכל טוב.
            </p>
          </li>
          <li className="lp-stage">
            <div className="lp-frame lp-stage__photo--2" data-shutter>
              <img
                src={photo('jvari-monastery-mtskheta-georgia.jpg')}
                width={1440}
                height={1019}
                decoding="async"
                style={{ objectPosition: '62% center' }}
                alt="מנזר ג׳ווארי מאבן על גבעה במצחתה"
              />
            </div>
            <p className="lp-stage__text--2" data-reveal>
              <b>אחר כך, מסלול.</b> מיקי בונה לכם מסלול אישי, יום אחרי יום ושעה אחרי שעה. משנים ומדייקים
              יחד, עד שהוא בדיוק כמו שרציתם.
            </p>
          </li>
          <li className="lp-stage">
            <div className="lp-frame lp-stage__photo--3" data-shutter>
              <img
                src={photo('view-of-sighnaghi-02.jpg')}
                width={1440}
                height={960}
                decoding="async"
                alt="גגות אדומים וכנסייה בסיגנאגי, ומאחוריהם עמק אלאזני"
              />
            </div>
            <p className="lp-stage__text--3" data-reveal>
              <b>ובזמן הטיול, מיקי איתכם.</b> בטלפון ובצ׳אט, בזמן אמת: לאן נוסעים עכשיו, מה מזמינים, ומה
              עושים אם משהו משתנה.
            </p>
          </li>
        </ol>
      </section>

      <Voices />

      <section aria-labelledby="close-title" className="lp-grid lp-close">
        <div data-reveal>
          <h2 id="close-title">
            ספרו למיקי מתי אתם רוצים לטוס ומה אתם אוהבים, והוא יבנה לכם את הטיול.
          </h2>
          <MainActions />
        </div>
      </section>

      <Footer />
    </div>
  )
}

// The bar on top: a link or two at the start, the name in the middle, the main action at the end.
function LandingNav() {
  const { user } = useAuth()

  return (
    <nav className="lp-grid" aria-label="ראשי">
      <div className="lp-nav" style={{ gridColumn: '1 / 13' }}>
        <div className="lp-nav__start">
          {!user && (
            <Link to="/login" className="lp-link">
              כניסה
            </Link>
          )}
          {user?.role === 'TRAVELER' && (
            <Link to="/trips" className="lp-link">
              הטיולים שלי
            </Link>
          )}
          {user?.role === 'GUIDE' && (
            <Link to="/guide/reviews" className="lp-link">
              ביקורות
            </Link>
          )}
          {user && (
            <Link to="/account" className="lp-link">
              החשבון שלי
            </Link>
          )}
        </div>
        <Link to="/" className="lp-nav__name" dir="ltr">
          Georgia Trips
        </Link>
        <div className="lp-nav__end">
          <PrimaryAction />
        </div>
      </div>
    </nav>
  )
}

// The one thing to do next, named for whoever is looking.
function PrimaryAction() {
  const { user } = useAuth()
  const [to, label] =
    user?.role === 'GUIDE'
      ? ['/guide', 'ללוח המדריך']
      : user?.role === 'TRAVELER'
        ? ['/trips/new', 'בקשת טיול חדשה']
        : ['/register', 'בואו נתכנן טיול']

  // The arrow points forward (left, in Hebrew) and steps ahead on hover. Decoration only.
  return (
    <Link to={to} className="lp-button">
      {label}
      <span className="lp-button__arrow" aria-hidden="true">
        ←
      </span>
    </Link>
  )
}

// The main action, with the second choice as a plain link beside it.
function MainActions() {
  const { user } = useAuth()
  return (
    <div className="lp-actions">
      <PrimaryAction />
      {!user && (
        <Link to="/login" className="lp-link">
          כבר יש לי חשבון
        </Link>
      )}
      {user?.role === 'TRAVELER' && (
        <Link to="/trips" className="lp-link">
          הטיולים שלי
        </Link>
      )}
    </div>
  )
}

// The one live thing: pick a Hebrew phrase, see it in Georgian letters and hear how it sounds.
function Phrasebook() {
  const all = phraseGroups.flatMap((group) => group.phrases)
  const [shown, setShown] = useState<Phrase>(all.find((p) => p.he === 'לחיים!') ?? all[0])

  return (
    <section aria-labelledby="say-title" className="lp-grid lp-say">
      <h2 id="say-title" className="lp-say__head" data-reveal>
        מה שמיקי יגיד בשבילכם
      </h2>
      <p className="lp-say__intro" data-reveal style={delay(80)}>
        בגיאורגיה מדברים גיאורגית, בכתב שלא דומה לשום כתב אחר. מיקי מדבר בשבילכם, ובכל זאת נעים לדעת כמה
        מילים. בחרו משפט וראו איך כותבים ואומרים אותו.
      </p>
      <p className="lp-say__shown" aria-live="polite">
        <span key={shown.ka} className="lp-say__ka lp-ka" lang="ka" dir="ltr">
          {shown.ka}
        </span>
        <span key={shown.say} className="lp-say__sound">
          {shown.say}
        </span>
        <span className="lp-say__he">{shown.he}</span>
      </p>
      {phraseGroups.map((group, index) => (
        <div key={group.title} className="lp-say__group" data-reveal style={delay(index * 90)}>
          <h3>{group.title}</h3>
          <ul>
            {group.phrases.map((phrase) => (
              <li key={phrase.he}>
                <button
                  type="button"
                  className="lp-say__phrase"
                  aria-pressed={phrase === shown}
                  onClick={() => setShown(phrase)}
                  onMouseEnter={() => setShown(phrase)}
                  onFocus={() => setShown(phrase)}
                >
                  {phrase.he}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}

// What travelers say: the newest review with words, set on the mountains. A signed-in traveler who
// hasn't written a general review yet can add one here.
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

  const write = canAdd && (
    <div className={writing ? 'lp-voice__form' : 'lp-voice__write'}>
      {writing ? (
        <div className="rounded-xl bg-surface p-4 text-ink">
          <ReviewForm question="מה דעתכם על Georgia Trips?" onSent={addReview} />
        </div>
      ) : (
        <button type="button" className="lp-link" onClick={() => setWriting(true)}>
          טיילתם עם מיקי? כתבו מה אתם חושבים
        </button>
      )}
    </div>
  )

  if (!quote) {
    return (
      <section aria-labelledby="voices-title" className="lp-grid lp-close">
        <div>
          <h2 id="voices-title">עוד אין ביקורות. אתם יכולים להיות הראשונים.</h2>
          {write}
        </div>
      </section>
    )
  }

  const count = data.count === 1 ? 'ביקורת אחת' : `${data.count} ביקורות`

  return (
    <section aria-labelledby="voices-title" className="lp-voice">
      <figure className="lp-voice__photo">
        <img
          src={photo('kazbegi-mountains-2.jpg')}
          width={1440}
          height={648}
          decoding="async"
          alt="רכס הרים ירוק ותלול בקזבגי, מתחת לשמיים כחולים"
        />
      </figure>
      <div className="lp-grid lp-voice__inner">
        <h2 id="voices-title" className="lp-voice__head">
          מה אומרים המטיילים
          {data.average !== null && (
            <span>
              {data.average.toFixed(1)} מתוך 5, לפי {count}
            </span>
          )}
        </h2>
        <blockquote className="lp-voice__quote">“{quote.text}”</blockquote>
        <p className="lp-voice__who">
          {quote.authorName}
          {quote.verifiedTrip && <span className="block">טיול מאומת</span>}
        </p>
        {write}
      </div>
    </section>
  )
}

function Footer() {
  const { user } = useAuth()

  return (
    <footer>
      {/* The last photograph, with the name across its foot. */}
      <div className="lp-foot">
        <figure className="lp-foot__photo">
          <img
            src={photo('vendanges-en-kakhetie-b.jpg')}
            width={1440}
            height={1116}
            decoding="async"
            alt="ליתוגרפיה משנת 1847: בציר ענבים בכרם בקאחתי"
          />
        </figure>
        <div className="lp-grid lp-foot__inner">
          <nav className="lp-foot__links" aria-label="קישורים">
            {user ? (
              <Link to={user.role === 'GUIDE' ? '/guide' : '/trips'} className="lp-link">
                {user.role === 'GUIDE' ? 'לוח המדריך' : 'הטיולים שלי'}
              </Link>
            ) : (
              <>
                <Link to="/register" className="lp-link">
                  הרשמה
                </Link>
                <Link to="/login" className="lp-link">
                  כניסה
                </Link>
              </>
            )}
          </nav>
          <p className="lp-foot__about">טיולים פרטיים בגיאורגיה, עם מיקי, מדריך שנולד שם ומדבר עברית.</p>
          <p className="lp-foot__name" aria-hidden="true">
            Georgia Trips
          </p>
        </div>
      </div>
      <div className="lp-grid lp-credits">
        <p>
          התמונות מוויקישיתוף:{' '}
          {credits.map((credit, index) => (
            <span key={credit.page}>
              <a href={credit.page} className="lp-link">
                {credit.what}
              </a>
              , <span dir="ltr">{credit.by}</span>,{' '}
              <a href={credit.licenceUrl} className="lp-link">
                {credit.licence}
              </a>
              {index < credits.length - 1 ? '; ' : '.'}
            </span>
          ))}
        </p>
      </div>
    </footer>
  )
}
