import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { apiFetch } from '../lib/api'
import { formatDate } from '../lib/dates'
import { cardClassName, errorBoxClassName, primaryButtonClassName } from '../lib/styles'
import { kosherLabels, statusLabels, type TripRequest, type TripStatus } from '../trips/types'

type TripRequestsResponse = { tripRequests: TripRequest[] }

const statusPillClassName: Record<TripStatus, string> = {
  NEW: 'bg-brand-soft text-brand',
  ITINERARY_SENT: 'bg-accent-soft text-accent',
  IN_REVISION: 'bg-accent-soft text-accent',
  CONFIRMED: 'bg-ok/15 text-ok',
  IN_PROGRESS: 'bg-ok/15 text-ok',
  COMPLETED: 'bg-line text-muted',
}

function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatBudget(trip: TripRequest): string | null {
  const { budgetMin: min, budgetMax: max, currency } = trip
  if (min !== null && max !== null) {
    return min === max
      ? formatMoney(min, currency)
      : `${formatMoney(min, currency)}–${formatMoney(max, currency)}`
  }
  if (min !== null) return `מ־${formatMoney(min, currency)}`
  if (max !== null) return `עד ${formatMoney(max, currency)}`
  return null
}

function servicesSummary(trip: TripRequest): string[] {
  if (trip.needsFullPackage) {
    return trip.needsCarRental ? ['טיול מקיף', 'רכב שכור'] : ['טיול מקיף']
  }
  const services: string[] = []
  if (trip.needsFlights) services.push('טיסות')
  if (trip.needsHotels) services.push('מלונות')
  if (trip.needsCarRental) services.push('רכב שכור')
  return services
}

export function MyTripsPage() {
  const [trips, setTrips] = useState<TripRequest[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch<TripRequestsResponse>('/api/trip-requests')
      .then((data) => setTrips(data.tripRequests))
      .catch(() => setError('לא הצלחנו לטעון את הבקשות. נסו לרענן.'))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-brand">הטיולים שלי</h1>
        <Link to="/trips/new" className={`${primaryButtonClassName} px-4 text-sm`}>
          בקשה חדשה
        </Link>
      </div>

      {error && (
        <p role="alert" className={errorBoxClassName}>
          {error}
        </p>
      )}

      {trips === null && !error && <p className="text-muted">טוען...</p>}

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
            <li key={trip.id} className={`${cardClassName} space-y-2`}>
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold">
                  {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
                </p>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap ${statusPillClassName[trip.status]}`}
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
            </li>
          )
        })}
      </ul>
    </div>
  )
}
