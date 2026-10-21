import { Sparkles } from 'lucide-react'
import { useState } from 'react'
import { apiFetch, ApiError } from '../lib/api'

type Summary = { aiTags: string[]; aiSuggestion: string | null }

// The AI summary of a trip request, for the guide. Gold dashed border = written by AI.
// If there is no summary yet, offers to make one.
export function AiSummaryCard({ tripId, initial }: { tripId: string; initial: Summary }) {
  const [summary, setSummary] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function makeSummary() {
    setError('')
    setBusy(true)
    try {
      setSummary(
        await apiFetch<Summary>(`/api/guide/trip-requests/${tripId}/summary`, { method: 'POST' }),
      )
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 503
          ? 'סיכום AI עוד לא הוגדר בשרת.'
          : 'לא הצלחנו ליצור סיכום. נסו שוב בעוד רגע.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-2 rounded-xl border-[1.5px] border-dashed border-ai p-3">
      <p className="text-xs font-bold text-ai"><Sparkles className="icon" /> סיכום AI</p>

      {summary.aiTags.length > 0 ? (
        <>
          <div className="flex flex-wrap gap-1.5">
            {summary.aiTags.map((tag) => (
              <span key={tag} className="rounded-md border border-line bg-canvas px-2 py-0.5 text-sm">
                {tag}
              </span>
            ))}
          </div>
          {summary.aiSuggestion && (
            <p className="text-sm text-muted">הצעה: {summary.aiSuggestion}</p>
          )}
        </>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={makeSummary}
          className="text-sm font-semibold text-ai disabled:opacity-60"
        >
          {busy ? 'מסכם את הבקשה...' : 'יצירת סיכום לבקשה'}
        </button>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  )
}
