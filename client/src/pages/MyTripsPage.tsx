import { Check, MessageCircle, PenLine } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useUnread } from '../chat/useUnread'
import { ReviewForm } from '../components/ReviewForm'
import { UnreadBadge } from '../components/UnreadBadge'
import { Loading } from '../components/Loading'
import { apiFetch } from '../lib/api'
import { formatDate } from '../lib/dates'
import {
  cardClassName,
  errorBoxClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  pageTitleClassName,
} from '../lib/styles'
import { formatBudget, servicesSummary, statusPillClassName } from '../trips/format'
import { kosherLabels, type MyReviews, statusLabels, type TripRequest } from '../trips/types'

type TripRequestsResponse = { tripRequests: TripRequest[] }

export function MyTripsPage() {
  const [trips, setTrips] = useState<TripRequest[] | null>(null)
  const [error, setError] = useState('')
  const { byTrip } = useUnread()
  // Trips I already reviewed. Null until loaded, so no review button flashes in and out.
  const [reviewed, setReviewed] = useState<Set<string> | null>(null)

  useEffect(() => {
    apiFetch<TripRequestsResponse>('/api/trip-requests')
      .then((data) => setTrips(data.tripRequests))
      .catch(() => setError('לא הצלחנו לטעון את הבקשות. נסו לרענן.'))
    apiFetch<MyReviews>('/api/reviews/mine')
      .then((mine) => setReviewed(new Set(mine.reviewedTripIds)))
      .catch(() => {})
  }, [])

  function markReviewed(tripId: string) {
    setReviewed((prev) => new Set(prev).add(tripId))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className={pageTitleClassName}>הטיולים שלי</h1>
        <Link to="/trips/new" className={`${primaryButtonClassName} px-4 text-sm`}>
          בקשה חדשה
        </Link>
      </div>

      {error && (
        <p role="alert" className={errorBoxClassName}>
          {error}
        </p>
      )}

      {trips === null && !error && <Loading />}

      {trips?.length === 0 && (
        <p className={`${cardClassName} text-muted`}>
          עוד לא שלחתם בקשות. זה הזמן לתכנן את הטיול הראשון!
        </p>
      )}

      <ul className="space-y-3">
        {trips?.map((trip) => {
          const budget = formatBudget(trip)
          const services = servicesSummary(trip)
          return (
            // Named like the header of this trip's own screen, so opening it grows the card into it.
            <li
              key={trip.id}
              className={`trip-card ${cardClassName} space-y-2`}
              style={{ viewTransitionName: `trip-${trip.id}` }}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold">
                  {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
                </p>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap ${statusPillClassName[trip.status]}`}
                  style={{ viewTransitionName: `trip-status-${trip.id}` }}
                >
                  {statusLabels[trip.status]}
                </span>
              </div>
              <p className="text-sm text-muted">
                {trip.travelersCount} מטיילים
                {budget && ` · ${budget}`}
                {trip.kosher !== 'NONE' && ` · ${kosherLabels[trip.kosher]}`}
              </p>
              {services.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {services.map((service) => (
                    <span
                      key={service}
                      className="rounded-md border border-line bg-canvas px-2 py-0.5 text-xs"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              )}
              <p className="line-clamp-2 text-sm">{trip.description}</p>
              <div className="grid grid-cols-2 gap-2">
                <Link to={`/trips/${trip.id}`} className={`${secondaryButtonClassName} block`}>
                  {trip.status === 'ITINERARY_SENT' ? 'המסלול מחכה לכם' : 'לפרטי הטיול'}
                </Link>
                <Link
                  to={`/trips/${trip.id}/chat`}
                  className={`${secondaryButtonClassName} flex items-center justify-center gap-1.5`}
                >
                  <MessageCircle className="icon" /> צ'אט <UnreadBadge count={byTrip[trip.id] ?? 0} />
                </Link>
              </div>
              {reviewableStatuses.includes(trip.status) && reviewed && (
                <TripReview
                  trip={trip}
                  alreadyReviewed={reviewed.has(trip.id)}
                  onSent={() => markReviewed(trip.id)}
                />
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// A trip can be reviewed once it's over: travelled, or cancelled.
const reviewableStatuses: TripRequest['status'][] = ['COMPLETED', 'CANCELLED']

// "How was it?" under a finished trip: a button that opens the review form, then a thank-you.
function TripReview({
  trip,
  alreadyReviewed,
  onSent,
}: {
  trip: TripRequest
  alreadyReviewed: boolean
  onSent: () => void
}) {
  const [open, setOpen] = useState(false)

  if (alreadyReviewed) {
    return <p className="pop-slow text-center text-sm font-bold text-ok"><Check className="icon" /> תודה על הביקורת!</p>
  }
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`w-full ${primaryButtonClassName}`}
      >
        <PenLine className="icon" /> כתיבת ביקורת
      </button>
    )
  }
  return (
    <div className="enter border-t border-line pt-3">
      <ReviewForm
        tripId={trip.id}
        question={trip.status === 'CANCELLED' ? 'איך היה הטיפול בבקשה שלכם?' : 'איך היה?'}
        onSent={onSent}
      />
    </div>
  )
}
