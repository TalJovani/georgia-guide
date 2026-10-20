import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { nowInGeorgia, tripDayIndex, tripLengthInDays } from '../lib/dates'
import { cardClassName } from '../lib/styles'
import type { ItineraryActivity, TravelerTripDetail } from '../trips/types'
import { ItinerarySchedule } from './ItinerarySchedule'

type SlotState = 'past' | 'now' | 'next' | 'later'

// For each of today's activities: done, happening now, next up, or later.
// "Next" is marked only when nothing is happening right now.
function slotStates(activities: ItineraryActivity[], time: string): SlotState[] {
  const somethingNow = activities.some((a) => a.startTime <= time && time < a.endTime)
  let nextMarked = somethingNow
  return activities.map((activity) => {
    if (activity.endTime <= time) return 'past'
    if (activity.startTime <= time) return 'now'
    if (!nextMarked) {
      nextMarked = true
      return 'next'
    }
    return 'later'
  })
}

// The time in Georgia, refreshed every 30 seconds so "now" moves along by itself.
function useNowInGeorgia() {
  const [now, setNow] = useState(nowInGeorgia)
  useEffect(() => {
    const timer = setInterval(() => setNow(nowInGeorgia()), 30_000)
    return () => clearInterval(timer)
  }, [])
  return now
}

const slotClassName: Record<SlotState, string> = {
  past: 'border-line bg-surface opacity-60',
  now: 'border-brand bg-brand-soft',
  next: 'border-accent bg-surface',
  later: 'border-line bg-surface',
}

// What the traveler sees during the trip: where they are, today's plan, and help in one tap.
export function TodayView({ trip }: { trip: TravelerTripDetail }) {
  const now = useNowInGeorgia()
  const length = tripLengthInDays(trip.startDate, trip.endDate)
  // Kept inside the trip, in case the clock (or a test `?at=`) is outside its dates.
  const todayIndex = Math.min(Math.max(tripDayIndex(trip.startDate, now.date), 0), length - 1)
  const days = Array.from({ length }, (_, index) =>
    trip.itineraryDays.find((day) => day.dayNumber === index + 1),
  )
  const today = days[todayIndex]
  const activities = today?.activities ?? []
  const states = slotStates(activities, now.time)

  return (
    <div className="space-y-4">
      <section className={`${cardClassName} space-y-1`}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted">היום אתם ב־</span>
          <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-bold text-accent">
            יום {todayIndex + 1} מתוך {length}
          </span>
        </div>
        <p className="font-display text-3xl text-brand">{today?.title ?? 'יום חופשי'}</p>
      </section>

      <ol aria-label="ההתקדמות במסלול" className="flex gap-1 overflow-x-auto pb-1">
        {days.map((day, index) => {
          const isToday = index === todayIndex
          return (
            <li
              key={index}
              aria-current={isToday ? 'step' : undefined}
              className="flex min-w-24 flex-1 flex-col items-center gap-1 text-center text-xs"
            >
              <span
                className={`h-1 w-full rounded-full ${index <= todayIndex ? 'bg-brand' : 'bg-line'}`}
              />
              {index < todayIndex && <span className="h-3 w-3 rounded-full bg-brand" />}
              {isToday && (
                <span className="h-4 w-4 rounded-full border-[3px] border-brand bg-surface ring-4 ring-brand/20 motion-safe:animate-pulse" />
              )}
              {index > todayIndex && (
                <span className="h-3 w-3 rounded-full border-2 border-muted bg-surface" />
              )}
              <span className="text-muted">יום {index + 1}</span>
              <span className={`line-clamp-2 ${isToday ? 'font-bold text-brand' : ''}`}>
                {day?.title ?? '—'}
              </span>
              {isToday && <span className="font-bold text-brand">אתם כאן</span>}
            </li>
          )
        })}
      </ol>

      <section className="space-y-2">
        <h2 className="font-bold">התוכנית להיום</h2>
        {activities.length === 0 ? (
          <p className={`${cardClassName} text-sm text-muted`}>אין פעילויות מתוכננות להיום.</p>
        ) : (
          <ol className="space-y-1.5">
            {activities.map((activity, index) => (
              <li
                key={activity.id}
                aria-current={states[index] === 'now' ? 'time' : undefined}
                className={`grid grid-cols-[3.5rem_1fr_auto] items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm ${slotClassName[states[index]]}`}
              >
                <time dir="ltr" className="text-right font-bold text-muted tabular-nums">
                  {activity.startTime}
                </time>
                <span>
                  {activity.title}
                  {activity.details && (
                    <small className="block text-muted">{activity.details}</small>
                  )}
                </span>
                {states[index] === 'past' && <span className="font-bold text-ok">✓</span>}
                {states[index] === 'now' && (
                  <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-on-brand">
                    עכשיו
                  </span>
                )}
                {states[index] === 'next' && (
                  <span className="rounded-full border border-accent px-2 py-0.5 text-xs font-bold text-accent">
                    הבא
                  </span>
                )}
                {states[index] === 'later' && <span />}
              </li>
            ))}
          </ol>
        )}
      </section>

      <div className="grid grid-cols-3 gap-2 text-sm">
        {trip.guide?.phone && (
          <a
            href={`tel:${trip.guide.phone}`}
            className="rounded-xl bg-accent py-2.5 text-center font-bold text-on-brand"
          >
            ☎ התקשרות למדריך
          </a>
        )}
        <Link
          to={`/trips/${trip.id}/chat`}
          className="rounded-xl bg-accent py-2.5 text-center font-bold text-on-brand"
        >
          ✉ צ'אט עם המדריך
        </Link>
        <a
          href="tel:112"
          className="rounded-xl border-[1.5px] border-danger bg-surface py-2.5 text-center font-bold text-danger"
        >
          ! מקרה חירום · 112
        </a>
      </div>

      <section className="space-y-2">
        <h2 className="font-bold">המסלול המלא</h2>
        <ItinerarySchedule
          startDate={trip.startDate}
          endDate={trip.endDate}
          itineraryDays={trip.itineraryDays}
          initialDayIndex={todayIndex}
        />
      </section>
    </div>
  )
}
