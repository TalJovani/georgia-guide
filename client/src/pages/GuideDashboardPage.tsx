import { MessageCircle } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useUnread } from '../chat/useUnread'
import { AiSummaryCard } from '../components/AiSummaryCard'
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
import {
  kosherLabels,
  statusLabels,
  type GuideTripRequest,
  type TripStatus,
} from '../trips/types'

type GuideTripRequestsResponse = { tripRequests: GuideTripRequest[] }

const statusOrder = Object.keys(statusLabels) as TripStatus[]

export function GuideDashboardPage() {
  const [trips, setTrips] = useState<GuideTripRequest[] | null>(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<TripStatus | 'ALL'>('ALL')

  useEffect(() => {
    apiFetch<GuideTripRequestsResponse>('/api/guide/trip-requests')
      .then((data) => setTrips(data.tripRequests))
      .catch(() => setError('לא הצלחנו לטעון את הבקשות. נסו לרענן.'))
  }, [])

  const countByStatus = (status: TripStatus) =>
    trips?.filter((trip) => trip.status === status).length ?? 0

  const visibleTrips =
    filter === 'ALL' ? trips : trips?.filter((trip) => trip.status === filter)

  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between">
        <h1 className={pageTitleClassName}>לוח המדריך</h1>
        {trips && <span className="text-sm font-bold text-muted">{trips.length} בקשות</span>}
      </div>

      {trips && trips.length > 0 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="סינון לפי סטטוס">
          <FilterChip active={filter === 'ALL'} onClick={() => setFilter('ALL')}>
            הכול ({trips.length})
          </FilterChip>
          {statusOrder
            .filter((status) => countByStatus(status) > 0)
            .map((status) => (
              <FilterChip
                key={status}
                active={filter === status}
                onClick={() => setFilter(status)}
              >
                {statusLabels[status]} ({countByStatus(status)})
              </FilterChip>
            ))}
        </div>
      )}

      {error && (
        <p role="alert" className={errorBoxClassName}>
          {error}
        </p>
      )}

      {trips === null && !error && <Loading />}

      {trips?.length === 0 && (
        <p className={`${cardClassName} text-muted`}>
          עוד לא הגיעו בקשות. כשמטייל ישלח בקשה, היא תופיע כאן.
        </p>
      )}

      <ul className="space-y-3">
        {visibleTrips?.map((trip) => (
          <GuideTripCard key={trip.id} trip={trip} />
        ))}
      </ul>
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="press rounded-full bg-surface px-3.5 py-1.5 text-sm aria-pressed:bg-ink aria-pressed:font-semibold aria-pressed:text-canvas"
    >
      {children}
    </button>
  )
}

function GuideTripCard({ trip }: { trip: GuideTripRequest }) {
  const budget = formatBudget(trip)
  const services = servicesSummary(trip)
  const { byTrip } = useUnread()

  return (
    <li className={`${cardClassName} space-y-3`}>
      <div className="flex items-center justify-between gap-2">
        <strong className="text-lg">{trip.traveler.name}</strong>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap ${statusPillClassName[trip.status]}`}
        >
          {statusLabels[trip.status]}
        </span>
      </div>

      <p className="text-sm text-muted">
        {formatDate(trip.startDate)} – {formatDate(trip.endDate)} · {trip.travelersCount}{' '}
        מטיילים
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

      <AiSummaryCard tripId={trip.id} initial={trip} />

      <p className="text-sm whitespace-pre-line">{trip.description}</p>

      <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-2 text-sm">
        {trip.traveler.phone && (
          <a href={`tel:${trip.traveler.phone}`} dir="ltr" className="font-bold text-accent">
            {trip.traveler.phone}
          </a>
        )}
        <a href={`mailto:${trip.traveler.email}`} dir="ltr" className="text-accent">
          {trip.traveler.email}
        </a>
        <span className="text-muted">נשלחה {formatDate(trip.createdAt)}</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Link to={`/guide/trips/${trip.id}`} className={`${primaryButtonClassName} block`}>
          {trip.status === 'NEW' ? 'התחל לתכנן' : 'למסלול'}
        </Link>
        <Link
          to={`/guide/trips/${trip.id}/chat`}
          className={`${secondaryButtonClassName} flex items-center justify-center gap-1.5`}
        >
          <MessageCircle className="icon" /> צ'אט <UnreadBadge count={byTrip[trip.id] ?? 0} />
        </Link>
      </div>
    </li>
  )
}
