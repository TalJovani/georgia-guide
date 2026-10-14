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

// "2026-11-10T00:00:00.000Z" -> "10.11.2026", without timezone shifts.
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.slice(0, 10).split('-')
  return `${day}.${month}.${year}`
}
