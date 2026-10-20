import { type FormEvent, useState } from 'react'
import { apiFetch, ApiError } from '../lib/api'
import { errorBoxClassName, inputClassName, primaryButtonClassName } from '../lib/styles'
import type { Review } from '../trips/types'
import { StarPicker } from './Stars'

const MAX_TEXT_LENGTH = 2000

// Write a review: about one trip (`tripId`), or about the site in general (no `tripId`).
// Once sent it can't be changed, and it is public with the author's full name.
export function ReviewForm({
  tripId,
  question,
  onSent,
}: {
  tripId?: string
  question: string
  onSent: (review: Review) => void
}) {
  const [rating, setRating] = useState(0)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (rating === 0) {
      setError('בחרו דירוג של 1 עד 5 כוכבים')
      return
    }
    setSending(true)
    setError('')
    try {
      const data = await apiFetch<{ review: Review }>('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({ rating, text, ...(tripId && { tripRequestId: tripId }) }),
      })
      onSent(data.review)
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 409
          ? 'כבר כתבתם ביקורת כאן, או שהטיול עוד לא הסתיים.'
          : 'הביקורת לא נשלחה. נסו שוב.',
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-center font-bold">{question}</p>
      <StarPicker value={rating} onChange={setRating} />
      <label className="block space-y-1 text-sm">
        <span className="font-semibold">מה הכי אהבתם? (לא חובה)</span>
        <textarea
          rows={3}
          maxLength={MAX_TEXT_LENGTH}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className={inputClassName}
        />
      </label>
      {error && (
        <p role="alert" className={errorBoxClassName}>
          {error}
        </p>
      )}
      <p className="text-xs text-muted">
        הביקורת תפורסם באתר עם השם המלא שלכם, ולא תוכלו לערוך אותה אחרי השליחה.
      </p>
      <button type="submit" disabled={sending} className={`w-full ${primaryButtonClassName}`}>
        {sending ? 'שולח...' : 'שליחת ביקורת'}
      </button>
    </form>
  )
}
