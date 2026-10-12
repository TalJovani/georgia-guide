// Today's date as YYYY-MM-DD in Israel (matches the server's check).
export function todayInIsrael(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem' }).format(new Date())
}

// "2026-11-10T00:00:00.000Z" -> "10.11.2026", without timezone shifts.
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.slice(0, 10).split('-')
  return `${day}.${month}.${year}`
}
