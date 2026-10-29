import type { TripRequest, TripStatus } from './types'

// One pale pill per state; only the state that waits on the traveler (the itinerary is ready to
// read) is filled in solid blue, so it is the one that catches the eye in a list.
export const statusPillClassName: Record<TripStatus, string> = {
  NEW: 'bg-brand-soft text-accent',
  ITINERARY_SENT: 'bg-brand text-on-brand',
  IN_REVISION: 'bg-ai/12 text-ai',
  CONFIRMED: 'bg-ok/15 text-ok',
  IN_PROGRESS: 'bg-ok/15 text-ok',
  COMPLETED: 'bg-line text-muted',
  CANCELLED: 'bg-danger-soft text-danger',
}

function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatBudget(trip: TripRequest): string | null {
  const { budgetMin: min, budgetMax: max, currency } = trip
  if (min !== null && max !== null) {
    return min === max
      ? formatMoney(min, currency)
      : `${formatMoney(min, currency)}–${formatMoney(max, currency)}`
  }
  if (min !== null) return `מ־${formatMoney(min, currency)}`
  if (max !== null) return `עד ${formatMoney(max, currency)}`
  return null
}

export function servicesSummary(trip: TripRequest): string[] {
  if (trip.needsFullPackage) {
    return trip.needsCarRental ? ['טיול מקיף', 'רכב שכור'] : ['טיול מקיף']
  }
  const services: string[] = []
  if (trip.needsFlights) services.push('טיסות')
  if (trip.needsHotels) services.push('מלונות')
  if (trip.needsCarRental) services.push('רכב שכור')
  return services
}
