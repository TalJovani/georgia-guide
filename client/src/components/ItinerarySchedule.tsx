import { useState } from 'react'
import { dateOfTripDay, tripLengthInDays } from '../lib/dates'
import { cardClassName } from '../lib/styles'
import type { ItineraryDay } from '../trips/types'

// A row of buttons, one per trip day. Days that already have a plan get a dot.
export function DayTabs({
  startDate,
  filled,
  selected,
  onSelect,
}: {
  startDate: string
  filled: boolean[]
  selected: number
  onSelect: (index: number) => void
}) {
  return (
    <div role="tablist" aria-label="ימי הטיול" className="flex gap-2 overflow-x-auto pb-1">
      {filled.map((isFilled, index) => (
        <button
          key={index}
          type="button"
          role="tab"
          aria-selected={index === selected}
          onClick={() => onSelect(index)}
          className="shrink-0 rounded-xl border border-line bg-surface px-3 py-1.5 text-center text-sm aria-selected:border-accent aria-selected:font-bold aria-selected:text-accent"
        >
          <span className="block">
            יום {index + 1}
            {isFilled && <span className="mr-1 text-accent">•</span>}
          </span>
          <span className="block text-xs text-muted">{dateOfTripDay(startDate, index + 1)}</span>
        </button>
      ))}
    </div>
  )
}

// Read-only itinerary: pick a day, see its activities by the hour.
// Opens on `initialDayIndex` if given (e.g. today), otherwise on the first planned day.
export function ItinerarySchedule({
  startDate,
  endDate,
  itineraryDays,
  initialDayIndex,
}: {
  startDate: string
  endDate: string
  itineraryDays: ItineraryDay[]
  initialDayIndex?: number
}) {
  const length = tripLengthInDays(startDate, endDate)
  const days = Array.from({ length }, (_, index) =>
    itineraryDays.find((day) => day.dayNumber === index + 1),
  )
  const [selected, setSelected] = useState(
    () => initialDayIndex ?? Math.max(0, days.findIndex(Boolean)),
  )
  const day = days[selected]

  return (
    <div className="space-y-3">
      <DayTabs
        startDate={startDate}
        filled={days.map(Boolean)}
        selected={selected}
        onSelect={setSelected}
      />

      <div role="tabpanel" className={`${cardClassName} space-y-3`}>
        {!day ? (
          <p className="text-sm text-muted">אין תוכנית ליום הזה.</p>
        ) : (
          <>
            <h3 className="font-display text-xl text-brand">{day.title}</h3>
            {day.activities.length === 0 && (
              <p className="text-sm text-muted">לא נקבעו פעילויות לפי שעות.</p>
            )}
            <ol className="space-y-2">
              {day.activities.map((activity) => (
                <li
                  key={activity.id}
                  className="grid grid-cols-[6.5rem_1fr] gap-3 border-r-2 border-accent pr-3"
                >
                  <span dir="ltr" className="text-right font-semibold text-accent">
                    {activity.startTime}–{activity.endTime}
                  </span>
                  <span>
                    {activity.title}
                    {activity.details && (
                      <small className="block text-muted">{activity.details}</small>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
    </div>
  )
}
