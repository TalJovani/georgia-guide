export type KosherPreference = 'NONE' | 'KOSHER_STYLE' | 'KOSHER' | 'MEHADRIN'

export type TripStatus =
  | 'NEW'
  | 'ITINERARY_SENT'
  | 'IN_REVISION'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'

export type TripRequest = {
  id: string
  startDate: string
  endDate: string
  travelersCount: number
  budgetMin: number | null
  budgetMax: number | null
  currency: string
  kosher: KosherPreference
  needsFlights: boolean
  needsHotels: boolean
  needsCarRental: boolean
  needsFullPackage: boolean
  description: string
  status: TripStatus
  // What the traveler asked to change, the last time they requested changes.
  revisionNote: string | null
  createdAt: string
}

export type GuideTripRequest = TripRequest & {
  traveler: {
    name: string
    email: string
    phone: string | null
  }
}

// Times are "HH:MM" in 24-hour time, sorted by startTime by the server.
export type ItineraryActivity = {
  id: string
  startTime: string
  endTime: string
  title: string
  details: string | null
}

export type ItineraryDay = {
  id: string
  dayNumber: number
  title: string
  activities: ItineraryActivity[]
}

export type GuideTripDetail = GuideTripRequest & {
  itineraryDays: ItineraryDay[]
}

// The traveler's own trip. The itinerary is empty while the guide is still working on it.
export type TravelerTripDetail = TripRequest & {
  guide: { name: string; phone: string | null } | null
  itineraryDays: ItineraryDay[]
}

// Mirrors ITINERARY_EDITABLE_STATUSES on the server.
export const itineraryEditableStatuses: readonly TripStatus[] = ['NEW', 'IN_REVISION']

// Statuses the server's state machine lets move to CANCELLED.
export const cancellableStatuses: readonly TripStatus[] = [
  'NEW',
  'ITINERARY_SENT',
  'IN_REVISION',
  'CONFIRMED',
]

export const kosherLabels: Record<KosherPreference, string> = {
  NONE: 'ללא',
  KOSHER_STYLE: 'סגנון כשר (בלי חזיר ופירות ים)',
  KOSHER: 'כשר',
  MEHADRIN: 'כשר למהדרין',
}

export const statusLabels: Record<TripStatus, string> = {
  NEW: 'חדשה',
  ITINERARY_SENT: 'מסלול נשלח',
  IN_REVISION: 'בתיקונים',
  CONFIRMED: 'נסגר',
  IN_PROGRESS: 'בטיול',
  COMPLETED: 'הסתיים',
  CANCELLED: 'בוטל',
}
