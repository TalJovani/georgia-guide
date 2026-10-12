export type KosherPreference = 'NONE' | 'KOSHER_STYLE' | 'KOSHER' | 'MEHADRIN'

export type TripStatus =
  | 'NEW'
  | 'ITINERARY_SENT'
  | 'IN_REVISION'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'

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
  createdAt: string
}

export type GuideTripRequest = TripRequest & {
  traveler: {
    name: string
    email: string
    phone: string | null
  }
}

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
}
