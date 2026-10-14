import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { TextField } from '../components/TextField'
import { apiFetch, ApiError } from '../lib/api'
import { dateOfTripDay, formatDate, tripLengthInDays } from '../lib/dates'
import {
  cardClassName,
  errorBoxClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  successBoxClassName,
} from '../lib/styles'
import { formatBudget, servicesSummary, statusPillClassName } from '../trips/format'
import {
  itineraryEditableStatuses,
  kosherLabels,
  statusLabels,
  type GuideTripDetail,
  type ItineraryDay,
  type TripStatus,
} from '../trips/types'

type DayDraft = { title: string; details: string }

// One draft per trip day, filled from what the guide already saved.
function toDrafts(trip: GuideTripDetail): DayDraft[] {
  const length = tripLengthInDays(trip.startDate, trip.endDate)
  return Array.from({ length }, (_, index) => {
    const saved = trip.itineraryDays.find((day) => day.dayNumber === index + 1)
    return { title: saved?.title ?? '', details: saved?.details ?? '' }
  })
}

// Days with an empty title are left out, so the guide can skip days.
function toPayload(drafts: DayDraft[]) {
  const days = drafts
    .map((draft, index) => ({
      dayNumber: index + 1,
      title: draft.title.trim(),
      ...(draft.details.trim() && { details: draft.details.trim() }),
    }))
    .filter((day) => day.title)
  return { days }
}

export function GuideTripPage() {
  const { id } = useParams()
  const [trip, setTrip] = useState<GuideTripDetail | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch<{ tripRequest: GuideTripDetail }>(`/api/guide/trip-requests/${id}`)
      .then((data) => setTrip(data.tripRequest))
      .catch((err) =>
        setError(
          err instanceof ApiError && err.status === 404
            ? 'הבקשה לא נמצאה, או שמדריך אחר כבר מטפל בה.'
            : 'לא הצלחנו לטעון את הבקשה. נסו לרענן.',
        ),
      )
  }, [id])

  return (
    <div className="space-y-5">
      <Link to="/guide" className="text-sm font-semibold text-accent">
        → חזרה ללוח המדריך
      </Link>

      {error && (
        <p role="alert" className={errorBoxClassName}>
          {error}
        </p>
      )}

      {trip === null && !error && <p className="text-muted">טוען...</p>}

      {trip && (
        <>
          <TripSummary trip={trip} />
          {itineraryEditableStatuses.includes(trip.status) ? (
            <ItineraryEditor trip={trip} onChange={setTrip} />
          ) : (
            <ItineraryView trip={trip} />
          )}
        </>
      )}
    </div>
  )
}

function TripSummary({ trip }: { trip: GuideTripDetail }) {
  const budget = formatBudget(trip)
  const services = servicesSummary(trip)

  return (
    <section className={`${cardClassName} space-y-2`}>
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-display text-2xl text-brand">מסלול · {trip.traveler.name}</h1>
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
        {services.length > 0 && ` · ${services.join(', ')}`}
      </p>
      <p className="text-sm whitespace-pre-line">{trip.description}</p>
    </section>
  )
}

function ItineraryEditor({
  trip,
  onChange,
}: {
  trip: GuideTripDetail
  onChange: (trip: GuideTripDetail) => void
}) {
  const [drafts, setDrafts] = useState(() => toDrafts(trip))
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  function updateDay(index: number, field: keyof DayDraft, value: string) {
    setDrafts((prev) =>
      prev.map((draft, i) => (i === index ? { ...draft, [field]: value } : draft)),
    )
  }

  async function saveAndMaybeSend(send: boolean) {
    setMessage(null)
    const payload = toPayload(drafts)
    if (send && payload.days.length === 0) {
      setMessage({ ok: false, text: 'מלאו לפחות יום אחד לפני השליחה' })
      return
    }

    setBusy(true)
    try {
      const { itineraryDays } = await apiFetch<{ itineraryDays: ItineraryDay[] }>(
        `/api/guide/trip-requests/${trip.id}/itinerary`,
        { method: 'PUT', body: JSON.stringify(payload) },
      )
      if (send) {
        await apiFetch(`/api/guide/trip-requests/${trip.id}/send`, { method: 'POST' })
        onChange({ ...trip, itineraryDays, status: 'ITINERARY_SENT' })
        return
      }
      onChange({ ...trip, itineraryDays })
      setMessage({ ok: true, text: 'הטיוטה נשמרה. המטיילים עוד לא רואים אותה.' })
    } catch (err) {
      let text = 'משהו השתבש, נסו שוב'
      if (err instanceof ApiError && err.status === 409) text = 'הבקשה השתנתה בינתיים. רעננו את הדף.'
      if (err instanceof ApiError && err.status === 400) text = 'חלק מהימים לא תקינים'
      setMessage({ ok: false, text })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold">
        {trip.status === 'IN_REVISION' ? 'עדכון המסלול לפי בקשת המטיילים' : 'בניית המסלול'}
      </h2>
      <p className="text-sm text-muted">
        כתבו מה עושים בכל יום. יום בלי כותרת לא יופיע במסלול.
      </p>

      <ol className="space-y-3">
        {drafts.map((draft, index) => (
          <li key={index} className={`${cardClassName} space-y-3`}>
            <p className="font-display text-accent">
              יום {index + 1}{' '}
              <span className="font-body text-sm text-muted">
                · {dateOfTripDay(trip.startDate, index + 1)}
              </span>
            </p>
            <TextField
              id={`day-${index + 1}-title`}
              label="מה עושים"
              placeholder="למשל: קאחתי, יקבים וסיגנאגי"
              maxLength={200}
              value={draft.title}
              onChange={(event) => updateDay(index, 'title', event.target.value)}
            />
            <TextField
              id={`day-${index + 1}-details`}
              label="פרטים (לא חובה)"
              placeholder="למשל: ארוחת צהריים במרתף יין"
              maxLength={2000}
              value={draft.details}
              onChange={(event) => updateDay(index, 'details', event.target.value)}
            />
          </li>
        ))}
      </ol>

      {message && (
        <p role="status" className={message.ok ? successBoxClassName : errorBoxClassName}>
          {message.text}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => saveAndMaybeSend(false)}
          className={`${secondaryButtonClassName} flex-1`}
        >
          שמירת טיוטה
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => saveAndMaybeSend(true)}
          className={`${primaryButtonClassName} flex-1`}
        >
          {busy ? 'שולח...' : 'שליחת המסלול למטיילים'}
        </button>
      </div>
    </section>
  )
}

const viewMessages: Partial<Record<TripStatus, string>> = {
  ITINERARY_SENT: 'המסלול נשלח. מחכים לתשובת המטיילים.',
  CONFIRMED: 'המטיילים אישרו את המסלול.',
  CANCELLED: 'המטיילים ביטלו את הטיול.',
}

function ItineraryView({ trip }: { trip: GuideTripDetail }) {
  const message = viewMessages[trip.status]

  return (
    <section className="space-y-3">
      {message && <p className={`${cardClassName} font-semibold text-accent`}>{message}</p>}

      <ol className="space-y-2">
        {trip.itineraryDays.map((day) => (
          <li
            key={day.id}
            className={`${cardClassName} grid grid-cols-[3rem_1fr] items-center gap-2 py-2`}
          >
            <span className="text-center font-display text-accent">{day.dayNumber}</span>
            <span>
              {day.title}
              {day.details && <small className="block text-muted">{day.details}</small>}
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}
