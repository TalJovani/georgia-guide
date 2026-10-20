import { useEffect, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { apiFetch } from '../lib/api'
import { formatDate } from '../lib/dates'
import { cardClassName, secondaryButtonClassName } from '../lib/styles'
import type { MyReviews, Review, ReviewsResponse } from '../trips/types'
import { ReviewForm } from './ReviewForm'
import { Stars } from './Stars'

// What travelers say: the average rating and every visible review, newest first.
// A signed-in traveler who hasn't yet can add a general review about the site here.
// Shown to everyone, signed in or not.
export function ReviewsSection() {
  const { user } = useAuth()
  const [data, setData] = useState<ReviewsResponse | null>(null)
  const [canWriteGeneral, setCanWriteGeneral] = useState(false)
  const [writing, setWriting] = useState(false)

  useEffect(() => {
    apiFetch<ReviewsResponse>('/api/reviews')
      .then(setData)
      .catch(() => setData({ reviews: [], average: null, count: 0 }))
  }, [])

  useEffect(() => {
    if (user?.role !== 'TRAVELER') return
    apiFetch<MyReviews>('/api/reviews/mine')
      .then((mine) => setCanWriteGeneral(!mine.hasGeneralReview))
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
    setCanWriteGeneral(false)
    setWriting(false)
  }

  if (!data) return null

  return (
    <section aria-labelledby="reviews-title" className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="reviews-title" className="font-display text-2xl text-brand">
          מה אומרים המטיילים
        </h2>
        {data.average !== null && (
          <span className="flex items-center gap-1.5 text-sm font-bold">
            <Stars rating={data.average} />
            {data.average.toFixed(1)} · {data.count} ביקורות
          </span>
        )}
      </div>

      {user?.role === 'TRAVELER' && canWriteGeneral && !writing && (
        <button
          type="button"
          onClick={() => setWriting(true)}
          className={`w-full ${secondaryButtonClassName}`}
        >
          ✍ כתבו מה אתם חושבים עלינו
        </button>
      )}
      {writing && (
        <div className={cardClassName}>
          <ReviewForm question="מה דעתכם על Georgia Trips?" onSent={addReview} />
        </div>
      )}

      {data.reviews.length === 0 ? (
        <p className={`${cardClassName} text-sm text-muted`}>עוד אין ביקורות.</p>
      ) : (
        <ul className="space-y-2">
          {data.reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </ul>
      )}
    </section>
  )
}

export function ReviewCard({ review }: { review: Review }) {
  return (
    <li className={`${cardClassName} space-y-1.5`}>
      <div className="flex items-center justify-between gap-2">
        <strong>{review.authorName}</strong>
        <Stars rating={review.rating} />
      </div>
      {review.text && <p className="text-sm whitespace-pre-line">{review.text}</p>}
      <p className="flex flex-wrap gap-x-2 text-xs text-muted">
        <span>{formatDate(review.createdAt)}</span>
        {review.verifiedTrip && <span className="font-bold text-ok">✓ טיול מאומת</span>}
      </p>
    </li>
  )
}
