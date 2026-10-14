import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { AiSummaryCard } from '../components/AiSummaryCard'
import { DayTabs, ItinerarySchedule } from '../components/ItinerarySchedule'
import { TextField } from '../components/TextField'
import { apiFetch, ApiError } from '../lib/api'
import { formatDate, tripLengthInDays } from '../lib/dates'
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

// `key` only identifies the row for React; the server gives saved rows new ids.
type ActivityDraft = { key: string; startTime: string; endTime: string; title: string; details: string }
type DayDraft = { title: string; activities: ActivityDraft[] }

// One draft per trip day, filled from what the guide already saved.
function toDrafts(trip: GuideTripDetail): DayDraft[] {
  const length = tripLengthInDays(trip.startDate, trip.endDate)
  return Array.from({ length }, (_, index) => {
    const saved = trip.itineraryDays.find((day) => day.dayNumber === index + 1)
    return {
      title: saved?.title ?? '',
      activities: (saved?.activities ?? []).map((activity) => ({
        key: activity.id,
        startTime: activity.startTime,
        endTime: activity.endTime,
        title: activity.title,
        details: activity.details ?? '',
      })),
    }
  })
}

// Days with an empty title are left out, so the guide can skip days.
function toPayload(drafts: DayDraft[]) {
  const days = drafts
    .map((draft, index) => ({
      dayNumber: index + 1,
      title: draft.title.trim(),
      activities: draft.activities.map((activity) => ({
        startTime: activity.startTime,
        endTime: activity.endTime,
        title: activity.title.trim(),
        ...(activity.details.trim() && { details: activity.details.trim() }),
      })),
    }))
    .filter((day) => day.title)
  return { days }
}

// The first thing that would stop the itinerary from saving, or null if none.
function findProblem(drafts: DayDraft[]): { dayIndex: number; text: string } | null {
  for (const [dayIndex, draft] of drafts.entries()) {
    const problem = (text: string) => ({ dayIndex, text: `יום ${dayIndex + 1}: ${text}` })
    if (!draft.title.trim() && draft.activities.length > 0) {
      return problem('יש פעילויות אבל אין כותרת ליום')
    }
    for (const activity of draft.activities) {
      if (!activity.title.trim()) return problem('לכל פעילות צריך לכתוב מה עושים')
      if (!activity.startTime || !activity.endTime) return problem('חסרה שעה באחת הפעילויות')
      if (activity.endTime <= activity.startTime) {
        return problem(`שעת הסיום של "${activity.title.trim()}" צריכה להיות אחרי שעת ההתחלה`)
      }
    }
  }
  return null
}

// One hour after `time`, but never past the end of the day.
function oneHourAfter(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  if (hours >= 23) return '23:59'
  return `${String(hours + 1).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

// A new activity starts when the latest one ends, so the guide fills the day in order.
function newActivity(existing: ActivityDraft[]): ActivityDraft {
  const lastEnd = existing.map((activity) => activity.endTime).sort().at(-1)
  const startTime = lastEnd && lastEnd < '23:00' ? lastEnd : '09:00'
  return { key: crypto.randomUUID(), startTime, endTime: oneHourAfter(startTime), title: '', details: '' }
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
      <AiSummaryCard tripId={trip.id} initial={trip} />
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
  const [selected, setSelected] = useState(0)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const day = drafts[selected]

  function updateDay(change: (day: DayDraft) => DayDraft) {
    setDrafts((prev) => prev.map((draft, i) => (i === selected ? change(draft) : draft)))
  }

  function updateActivity(key: string, field: keyof Omit<ActivityDraft, 'key'>, value: string) {
    updateDay((draft) => ({
      ...draft,
      activities: draft.activities.map((activity) =>
        activity.key === key ? { ...activity, [field]: value } : activity,
      ),
    }))
  }

  function addActivity() {
    updateDay((draft) => ({ ...draft, activities: [...draft.activities, newActivity(draft.activities)] }))
  }

  function removeActivity(key: string) {
    updateDay((draft) => ({
      ...draft,
      activities: draft.activities.filter((activity) => activity.key !== key),
    }))
  }

  async function saveAndMaybeSend(send: boolean) {
    setMessage(null)
    const problem = findProblem(drafts)
    if (problem) {
      setSelected(problem.dayIndex)
      setMessage({ ok: false, text: problem.text })
      return
    }
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
      const saved = { ...trip, itineraryDays }
      onChange(saved)
      // Reload from the server's answer, which has each day's activities sorted by time.
      setDrafts(toDrafts(saved))
      setMessage({ ok: true, text: 'הטיוטה נשמרה. המטיילים עוד לא רואים אותה.' })
    } catch (err) {
      let text = 'משהו השתבש, נסו שוב'
      if (err instanceof ApiError && err.status === 409) text = 'הבקשה השתנתה בינתיים. רעננו את הדף.'
      if (err instanceof ApiError && err.status === 400) text = 'חלק מהפעילויות לא תקינות'
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
      {trip.status === 'IN_REVISION' && trip.revisionNote && (
        <div className={`${cardClassName} space-y-1 border-accent`}>
          <p className="text-sm font-bold text-accent">מה המטיילים ביקשו לשנות</p>
          <p className="text-sm whitespace-pre-line">{trip.revisionNote}</p>
        </div>
      )}
      <p className="text-sm text-muted">
        בחרו יום, תנו לו כותרת והוסיפו פעילויות לפי שעות. יום בלי כותרת לא יופיע במסלול.
      </p>

      <DayTabs
        startDate={trip.startDate}
        filled={drafts.map((draft) => draft.title.trim() !== '')}
        selected={selected}
        onSelect={setSelected}
      />

      <div role="tabpanel" className={`${cardClassName} space-y-3`}>
        <TextField
          id={`day-${selected + 1}-title`}
          label={`כותרת ליום ${selected + 1}`}
          placeholder="למשל: קאחתי, יקבים וסיגנאגי"
          maxLength={200}
          value={day.title}
          onChange={(event) => updateDay((draft) => ({ ...draft, title: event.target.value }))}
        />

        {day.activities.length === 0 && (
          <p className="text-sm text-muted">עוד אין פעילויות ביום הזה.</p>
        )}

        <ol className="space-y-3">
          {day.activities.map((activity) => (
            <li key={activity.key} className="space-y-2 rounded-xl border border-line p-3">
              <div className="grid grid-cols-2 gap-2">
                <TextField
                  id={`${activity.key}-start`}
                  label="משעה"
                  type="time"
                  value={activity.startTime}
                  onChange={(event) => updateActivity(activity.key, 'startTime', event.target.value)}
                />
                <TextField
                  id={`${activity.key}-end`}
                  label="עד שעה"
                  type="time"
                  value={activity.endTime}
                  onChange={(event) => updateActivity(activity.key, 'endTime', event.target.value)}
                />
              </div>
              <TextField
                id={`${activity.key}-title`}
                label="מה עושים"
                placeholder="למשל: סיור בעיר העתיקה"
                maxLength={200}
                value={activity.title}
                onChange={(event) => updateActivity(activity.key, 'title', event.target.value)}
              />
              <TextField
                id={`${activity.key}-details`}
                label="פרטים (לא חובה)"
                placeholder="למשל: נקודת מפגש בלובי המלון"
                maxLength={2000}
                value={activity.details}
                onChange={(event) => updateActivity(activity.key, 'details', event.target.value)}
              />
              <button
                type="button"
                onClick={() => removeActivity(activity.key)}
                className="text-sm font-semibold text-danger"
              >
                מחיקת הפעילות
              </button>
            </li>
          ))}
        </ol>

        <button type="button" onClick={addActivity} className={`${secondaryButtonClassName} w-full`}>
          + הוספת פעילות
        </button>
      </div>

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
      <ItinerarySchedule
        startDate={trip.startDate}
        endDate={trip.endDate}
        itineraryDays={trip.itineraryDays}
      />
    </section>
  )
}
