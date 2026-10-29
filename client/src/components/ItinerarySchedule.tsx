import { useLayoutEffect, useRef, useState } from 'react'
import { dateOfTripDay, tripLengthInDays } from '../lib/dates'
import { cardClassName } from '../lib/styles'
import type { ItineraryDay } from '../trips/types'

// A row of days in a grey track, like Apple's segmented control: one white marker sits under
// the chosen day and slides to the next one you pick, instead of each button lighting up on
// its own. Days that already have a plan get a dot.
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
  const track = useRef<HTMLDivElement>(null)
  const [marker, setMarker] = useState<{ left: number; width: number } | null>(null)

  // Measure the chosen tab before the browser paints, so the marker never shows in the wrong place.
  useLayoutEffect(() => {
    const tab = track.current?.children[selected + 1] as HTMLElement | undefined
    if (!tab) return
    setMarker({ left: tab.offsetLeft, width: tab.offsetWidth })
    tab.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
  }, [selected, filled.length])

  return (
    <div
      ref={track}
      role="tablist"
      aria-label="ימי הטיול"
      className="relative flex gap-1 overflow-x-auto rounded-2xl bg-ink/[0.06] p-1 [scrollbar-width:none]"
    >
      <span
        aria-hidden="true"
        className="day-marker absolute inset-y-1 rounded-xl bg-surface shadow-[0_1px_3px_rgb(0_0_0/0.12)]"
        style={marker ? { left: marker.left, width: marker.width } : { opacity: 0 }}
      />
      {filled.map((isFilled, index) => (
        <button
          key={index}
          type="button"
          role="tab"
          aria-selected={index === selected}
          onClick={() => onSelect(index)}
          className="press relative shrink-0 rounded-xl px-3.5 py-1.5 text-center text-sm text-ink/70 transition-colors aria-selected:font-semibold aria-selected:text-ink"
        >
          <span className="block">
            יום {index + 1}
            {isFilled && <span className="mr-1 text-accent">•</span>}
          </span>
          <span className="block text-xs text-muted tabular-nums">{dateOfTripDay(startDate, index + 1)}</span>
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
  // Which way the last switch went, so the day's plan slides in from that side.
  const [step, setStep] = useState<'later' | 'earlier' | null>(null)
  const day = days[selected]

  function choose(index: number) {
    if (index === selected) return
    setStep(index > selected ? 'later' : 'earlier')
    setSelected(index)
  }

  return (
    <div className="space-y-3">
      <DayTabs
        startDate={startDate}
        filled={days.map(Boolean)}
        selected={selected}
        onSelect={choose}
      />

      <div
        key={selected}
        role="tabpanel"
        className={`${cardClassName} space-y-3 ${step ? `day-in day-in--${step}` : ''}`}
      >
        {!day ? (
          <p className="text-sm text-muted">אין תוכנית ליום הזה.</p>
        ) : (
          <>
            <h3 className="font-display text-xl font-semibold text-ink">{day.title}</h3>
            {day.activities.length === 0 && (
              <p className="text-sm text-muted">לא נקבעו פעילויות לפי שעות.</p>
            )}
            <ol className="space-y-2">
              {day.activities.map((activity) => (
                <li
                  key={activity.id}
                  className="grid grid-cols-[6.5rem_1fr] gap-3 border-r-[3px] border-brand pr-3"
                >
                  <span dir="ltr" className="text-right font-medium text-muted tabular-nums">
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
