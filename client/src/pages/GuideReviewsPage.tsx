import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Stars } from '../components/Stars'
import { apiFetch } from '../lib/api'
import { formatDate } from '../lib/dates'
import { cardClassName, errorBoxClassName, secondaryButtonClassName } from '../lib/styles'
import type { GuideReview } from '../trips/types'

// Every review, hidden ones too. The guide can hide an offensive review from the public
// list, and bring it back. Nothing is deleted.
export function GuideReviewsPage() {
  const [reviews, setReviews] = useState<GuideReview[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch<{ reviews: GuideReview[] }>('/api/guide/reviews')
      .then((data) => setReviews(data.reviews))
      .catch(() => setError('לא הצלחנו לטעון את הביקורות. נסו לרענן.'))
  }, [])

  async function setHidden(review: GuideReview, hide: boolean) {
    setError('')
    try {
      await apiFetch<void>(`/api/guide/reviews/${review.id}/${hide ? 'hide' : 'unhide'}`, {
        method: 'POST',
      })
      const hiddenAt = hide ? new Date().toISOString() : null
      setReviews((prev) => prev && prev.map((r) => (r.id === review.id ? { ...r, hiddenAt } : r)))
    } catch {
      setError('השינוי לא נשמר. נסו שוב.')
    }
  }

  return (
    <div className="space-y-5">
      <Link to="/guide" className="text-sm font-semibold text-accent">
        → חזרה ללוח המדריך
      </Link>
      <h1 className="font-display text-2xl text-brand">ביקורות</h1>
      <p className="text-sm text-muted">
        ביקורת מוסתרת לא מופיעה באתר ולא נכנסת לדירוג הממוצע. אפשר להחזיר אותה בכל רגע.
      </p>

      {error && (
        <p role="alert" className={errorBoxClassName}>
          {error}
        </p>
      )}
      {reviews === null && !error && <p className="text-muted">טוען...</p>}
      {reviews?.length === 0 && <p className={`${cardClassName} text-muted`}>עוד אין ביקורות.</p>}

      <ul className="space-y-2">
        {reviews?.map((review) => (
          <li
            key={review.id}
            className={`${cardClassName} space-y-1.5 ${review.hiddenAt ? 'border-dashed opacity-60' : ''}`}
          >
            <div className="flex items-center justify-between gap-2">
              <strong>{review.authorName}</strong>
              <Stars rating={review.rating} />
            </div>
            {review.text && <p className="text-sm whitespace-pre-line">{review.text}</p>}
            <p className="flex flex-wrap gap-x-2 text-xs text-muted">
              <span>{formatDate(review.createdAt)}</span>
              {review.verifiedTrip && <span className="font-bold text-ok">✓ טיול מאומת</span>}
              {review.hiddenAt && <span className="font-bold text-danger">מוסתרת</span>}
            </p>
            <button
              type="button"
              onClick={() => setHidden(review, !review.hiddenAt)}
              className={`w-full text-sm ${secondaryButtonClassName}`}
            >
              {review.hiddenAt ? 'החזרה לאתר' : 'הסתרה מהאתר'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
