import { type ReactNode, useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { apiFetch } from '../lib/api'
import { UnreadContext } from './context'

// How often to ask the server about new messages, while the tab is visible.
const POLL_EVERY_MS = 15_000

// Keeps one count of unread chat messages for the whole app, so every page
// (app bar, trip lists) shows the same numbers from a single polling loop.
export function UnreadProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [byTrip, setByTrip] = useState<Record<string, number>>({})

  const refresh = useCallback(() => {
    apiFetch<{ unread: Record<string, number> }>('/api/messages/unread')
      .then((data) => setByTrip(data.unread))
      // A missed check is fine: the next one comes in a few seconds.
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!user) return
    refresh()
    const timer = setInterval(() => {
      if (!document.hidden) refresh()
    }, POLL_EVERY_MS)
    // Coming back to the tab: check right away instead of waiting for the next tick.
    function onVisible() {
      if (!document.hidden) refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [user, refresh])

  // After logout, don't show the previous user's numbers.
  const counts = user ? byTrip : {}
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0)

  return (
    <UnreadContext.Provider value={{ byTrip: counts, total, refresh }}>
      {children}
    </UnreadContext.Provider>
  )
}
