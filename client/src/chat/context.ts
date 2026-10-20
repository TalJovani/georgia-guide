import { createContext } from 'react'

export type UnreadContextValue = {
  // Messages from the other side that I haven't read yet, per trip id. Missing trip = 0.
  byTrip: Record<string, number>
  // All of them together, for the badge in the app bar.
  total: number
  // Ask the server again now (e.g. right after opening a chat marked messages as read).
  refresh: () => void
}

export const UnreadContext = createContext<UnreadContextValue | null>(null)
