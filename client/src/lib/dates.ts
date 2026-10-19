// Today's date as YYYY-MM-DD in Israel (matches the server's check).
export function todayInIsrael(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem' }).format(new Date())
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

// Number of days in a trip, counting both the first and the last day.
export function tripLengthInDays(startDate: string, endDate: string): number {
  return (Date.parse(endDate) - Date.parse(startDate)) / MS_PER_DAY + 1
}

// The date of day `dayNumber` of a trip (day 1 = startDate), as "10.11.2026".
export function dateOfTripDay(startDate: string, dayNumber: number): string {
  const date = new Date(Date.parse(startDate) + (dayNumber - 1) * MS_PER_DAY)
  return formatDate(date.toISOString())
}

// The date and time right now in Georgia, where the trip happens (activity times are local).
// In development, `?at=2026-10-14T11:30` in the address pretends it is that time, for testing.
export function nowInGeorgia(): { date: string; time: string } {
  const fake = import.meta.env.DEV && new URLSearchParams(window.location.search).get('at')
  if (fake && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(fake)) {
    return { date: fake.slice(0, 10), time: fake.slice(11) }
  }
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tbilisi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date())
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return { date: `${part('year')}-${part('month')}-${part('day')}`, time: `${part('hour')}:${part('minute')}` }
}

// Which day of the trip `date` is (0 = the first day). Negative before the trip, too big after it.
export function tripDayIndex(startDate: string, date: string): number {
  return Math.round((Date.parse(date) - Date.parse(startDate.slice(0, 10))) / MS_PER_DAY)
}

// "2026-11-10T00:00:00.000Z" -> "10.11.2026", without timezone shifts.
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.slice(0, 10).split('-')
  return `${day}.${month}.${year}`
}
