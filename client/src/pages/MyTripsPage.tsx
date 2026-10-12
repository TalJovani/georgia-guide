import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { apiFetch } from '../lib/api'
import { formatDate } from '../lib/dates'
import { kosherLabels, statusLabels, type TripRequest } from '../trips/types'

type TripRequestsResponse = { tripRequests: TripRequest[] }

function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
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
        <h1 className="text-2xl font-bold">הטיולים שלי</h1>
        <Link
          to="/trips/new"
          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
        >
          בקשה חדשה
        </Link>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {trips === null && !error && <p className="text-stone-500">טוען...</p>}

      {trips?.length === 0 && (
        <p className="rounded-lg bg-white p-4 text-stone-600 shadow-sm">
          עוד לא שלחתם בקשות. זה הזמן לתכנן את הטיול הראשון!
        </p>
      )}

      <ul className="space-y-3">
        {trips?.map((trip) => (
          <li key={trip.id} className="space-y-2 rounded-lg bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="font-medium">
                {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
              </p>
              <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-800">
                {statusLabels[trip.status]}
              </span>
            </div>
            <p className="text-sm text-stone-600">
              {trip.travelersCount} מטיילים
              {trip.budget !== null && ` · תקציב ${formatMoney(trip.budget, trip.currency)}`}
              {trip.kosher !== 'NONE' && ` · ${kosherLabels[trip.kosher]}`}
              {trip.needsFullPackage && ' · טיול מקיף'}
            </p>
            <p className="line-clamp-2 text-sm">{trip.description}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
