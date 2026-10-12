import type { TripRequest, TripStatus } from './types'

export const statusPillClassName: Record<TripStatus, string> = {
  NEW: 'bg-brand-soft text-brand',
  ITINERARY_SENT: 'bg-accent-soft text-accent',
  IN_REVISION: 'bg-accent-soft text-accent',
  CONFIRMED: 'bg-ok/15 text-ok',
  IN_PROGRESS: 'bg-ok/15 text-ok',
  COMPLETED: 'bg-line text-muted',
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
