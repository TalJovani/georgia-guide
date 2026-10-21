import { ArrowRight, Check, MessageCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { FormField } from '../components/FormField'
import { ItinerarySchedule } from '../components/ItinerarySchedule'
import { TodayView } from '../components/TodayView'
import { apiFetch, ApiError } from '../lib/api'
import { formatDate } from '../lib/dates'
import {
  cardClassName,
  dangerButtonClassName,
  errorBoxClassName,
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from '../lib/styles'
import { formatBudget, statusPillClassName } from '../trips/format'
import {
  cancellableStatuses,
  kosherLabels,
  statusLabels,
  type TravelerTripDetail,
  type TripRequest,
} from '../trips/types'

// Moves the trip to a new status. Returns the updated trip, or throws with a Hebrew message.
async function moveTrip(tripId: string, action: 'confirm' | 'request-changes' | 'cancel', body?: object) {
  try {
    const data = await apiFetch<{ tripRequest: TripRequest }>(`/api/trip-requests/${tripId}/${action}`, {
      method: 'POST',
      ...(body && { body: JSON.stringify(body) }),
    })
    return data.tripRequest
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) {
      throw new Error('הטיול השתנה בינתיים. רעננו את הדף.', { cause: err })
    }
    throw new Error('משהו השתבש, נסו שוב', { cause: err })
  }
}

export function TravelerTripPage() {
  const { id } = useParams()
  const [trip, setTrip] = useState<TravelerTripDetail | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch<{ tripRequest: TravelerTripDetail }>(`/api/trip-requests/${id}`)
      .then((data) => setTrip(data.tripRequest))
      .catch((err) =>
        setError(
          err instanceof ApiError && err.status === 404
            ? 'הטיול לא נמצא.'
            : 'לא הצלחנו לטעון את הטיול. נסו לרענן.',
        ),
      )
  }, [id])

  // The server answers a status change with the trip row only, so keep the guide and itinerary we have.
  function applyUpdate(updated: TripRequest) {
    setTrip((prev) => (prev ? { ...prev, ...updated } : prev))
  }

  return (
    <div className="space-y-5">
      <Link to="/trips" className="text-sm font-semibold text-accent">
        <ArrowRight className="icon" /> חזרה לטיולים שלי
      </Link>

      {error && (
        <p role="alert" className={errorBoxClassName}>
          {error}
        </p>
      )}

      {trip === null && !error && <p className="text-muted">טוען...</p>}

      {trip && (
        <>
          <TripHeader trip={trip} />
          {trip.status !== 'IN_PROGRESS' && (
            <Link to={`/trips/${trip.id}/chat`} className={`block ${secondaryButtonClassName}`}>
              <MessageCircle className="icon" /> צ'אט עם המדריך
            </Link>
          )}
          <TripBody trip={trip} onUpdate={applyUpdate} />
          {cancellableStatuses.includes(trip.status) && (
            <CancelTrip tripId={trip.id} onUpdate={applyUpdate} />
          )}
        </>
      )}
    </div>
  )
}

function TripHeader({ trip }: { trip: TravelerTripDetail }) {
  const budget = formatBudget(trip)

  return (
    <section className={`${cardClassName} space-y-2`}>
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-display text-2xl text-brand">הטיול שלנו</h1>
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
      {trip.guide && (
        <p className="text-sm">
          המדריך שלכם: <strong>{trip.guide.name}</strong>
          {trip.guide.phone && (
            <>
              {' · '}
              <a href={`tel:${trip.guide.phone}`} dir="ltr" className="font-semibold text-accent">
                {trip.guide.phone}
              </a>
            </>
          )}
        </p>
      )}
    </section>
  )
}

// What the traveler sees depends on where the trip is in the status state machine.
function TripBody({
  trip,
  onUpdate,
}: {
  trip: TravelerTripDetail
  onUpdate: (trip: TripRequest) => void
}) {
  const schedule = (
    <ItinerarySchedule
      startDate={trip.startDate}
      endDate={trip.endDate}
      itineraryDays={trip.itineraryDays}
    />
  )

  switch (trip.status) {
    case 'NEW':
      return (
        <p className={`${cardClassName} text-muted`}>
          הבקשה אצל המדריך. כשהמסלול יהיה מוכן, הוא יופיע כאן.
        </p>
      )
    case 'IN_REVISION':
      return (
        <div className={`${cardClassName} space-y-2`}>
          <p className="font-semibold text-accent">ביקשתם שינויים. המדריך מעדכן את המסלול.</p>
          {trip.revisionNote && (
            <p className="text-sm whitespace-pre-line text-muted">מה ביקשתם: {trip.revisionNote}</p>
          )}
        </div>
      )
    case 'ITINERARY_SENT':
      return (
        <section className="space-y-3">
          <h2 className="text-lg font-bold">המסלול שהמדריך הכין לכם</h2>
          {schedule}
          <ItineraryAnswer tripId={trip.id} onUpdate={onUpdate} />
        </section>
      )
    case 'CONFIRMED':
      return (
        <section className="space-y-3">
          <p className="text-center font-display text-xl text-ok"><Check className="icon" /> הכול סגור. נתראה בגאורגיה!</p>
          {schedule}
        </section>
      )
    case 'IN_PROGRESS':
      return <TodayView trip={trip} />
    case 'COMPLETED':
      return schedule
    case 'CANCELLED':
      return <p className={`${cardClassName} text-muted`}>הטיול בוטל.</p>
  }
}

// Approve the itinerary, or tell the guide what to change.
function ItineraryAnswer({
  tripId,
  onUpdate,
}: {
  tripId: string
  onUpdate: (trip: TripRequest) => void
}) {
  const [writingNote, setWritingNote] = useState(false)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function send(action: 'confirm' | 'request-changes') {
    setError('')
    if (action === 'request-changes' && !note.trim()) {
      setError('כתבו למדריך מה לשנות')
      return
    }
    setBusy(true)
    try {
      onUpdate(await moveTrip(tripId, action, action === 'request-changes' ? { note } : undefined))
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  return (
    <div className={`${cardClassName} space-y-3`}>
      {writingNote ? (
        <>
          <FormField id="revision-note" label="מה תרצו לשנות?">
            <textarea
              id="revision-note"
              className={inputClassName}
              rows={4}
              maxLength={2000}
              placeholder="לדוגמה: ביום 3 נעדיף פחות נסיעות, ואולי ספא במקום אופליסציחה"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </FormField>
          <div className="flex gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => send('request-changes')}
              className={`${primaryButtonClassName} flex-1`}
            >
              {busy ? 'שולח...' : 'שליחה למדריך'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setWritingNote(false)}
              className={`${secondaryButtonClassName} flex-1`}
            >
              חזרה
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-muted">המסלול מתאים לכם? אשרו אותו, או בקשו מהמדריך שינויים.</p>
          <div className="flex gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => send('confirm')}
              className={`${primaryButtonClassName} flex-1`}
            >
              {busy ? 'מאשר...' : 'אישור המסלול'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setWritingNote(true)}
              className={`${secondaryButtonClassName} flex-1`}
            >
              בקשת שינויים
            </button>
          </div>
        </>
      )}

      {error && (
        <p role="alert" className={errorBoxClassName}>
          {error}
        </p>
      )}
    </div>
  )
}

// Cancelling can't be undone, so it asks once more before calling the server.
function CancelTrip({ tripId, onUpdate }: { tripId: string; onUpdate: (trip: TripRequest) => void }) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function cancel() {
    setError('')
    setBusy(true)
    try {
      onUpdate(await moveTrip(tripId, 'cancel'))
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className="text-sm font-semibold text-danger">
        ביטול הטיול
      </button>
    )
  }

  return (
    <div className={`${cardClassName} space-y-3 border border-danger`}>
      <p className="font-semibold">לבטל את הטיול? אי אפשר לחזור מזה.</p>
      <div className="flex gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={cancel}
          className={`${dangerButtonClassName} flex-1`}
        >
          {busy ? 'מבטל...' : 'כן, לבטל'}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => setConfirming(false)}
          className={`${secondaryButtonClassName} flex-1`}
        >
          לא, להשאיר
        </button>
      </div>
      {error && (
        <p role="alert" className={errorBoxClassName}>
          {error}
        </p>
      )}
    </div>
  )
}
