import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { apiFetch, ApiError } from '../lib/api'
import { formatDate, formatMessageTime } from '../lib/dates'
import { cardClassName, errorBoxClassName, inputClassName, primaryButtonClassName } from '../lib/styles'
import { statusPillClassName } from '../trips/format'
import { type ChatMessage, statusLabels, type TripChat } from '../trips/types'

// How often the page asks the server for new messages (polling).
const POLL_EVERY_MS = 5_000
const MAX_MESSAGE_LENGTH = 2000

const lockedTexts: Partial<Record<TripChat['trip']['status'], string>> = {
  COMPLETED:
    'הטיול הסתיים, ואיתו גם השיחה נסגרה. ההודעות נשארות כאן לקריאה, ולכל שאלה נוספת אפשר להתקשר למדריך.',
  CANCELLED: 'הטיול בוטל, ולכן לא ניתן לשלוח הודעות חדשות. ההודעות הקודמות נשארות כאן לקריאה.',
}

// The chat between the traveler and the guide of one trip. Used by both sides;
// `backTo` is the trip page of whoever is looking.
export function TripChatPage({ backTo }: { backTo: (tripId: string) => string }) {
  const { id = '' } = useParams()
  const { user } = useAuth()
  const [chat, setChat] = useState<TripChat | null>(null)
  const [error, setError] = useState('')

  // Load now, then again every few seconds while the tab is open and visible.
  useEffect(() => {
    // Turned off when leaving the page, so a late answer doesn't update a page that's gone.
    let active = true
    function refresh() {
      apiFetch<TripChat>(`/api/trip-requests/${id}/messages`)
        .then((data) => {
          if (!active) return
          setChat(data)
          setError('')
        })
        .catch((err) => {
          if (!active) return
          setError(
            err instanceof ApiError && err.status === 404
              ? 'הטיול לא נמצא.'
              : 'לא הצלחנו לטעון את השיחה. ננסה שוב בעוד רגע.',
          )
        })
    }

    refresh()
    const timer = setInterval(() => {
      if (!document.hidden) refresh()
    }, POLL_EVERY_MS)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [id])

  function addSent(message: ChatMessage) {
    setChat((prev) => (prev ? { ...prev, messages: [...prev.messages, message] } : prev))
  }

  const otherSide =
    user?.role === 'GUIDE' ? chat?.trip.traveler.name : (chat?.trip.guide?.name ?? 'המדריך')

  return (
    <div className="space-y-4">
      <Link to={backTo(id)} className="text-sm font-semibold text-accent">
        → חזרה לטיול
      </Link>

      {error && (
        <p role="alert" className={errorBoxClassName}>
          {error}
        </p>
      )}

      {chat === null && !error && <p className="text-muted">טוען...</p>}

      {chat && (
        <>
          <section className={`${cardClassName} space-y-1`}>
            <div className="flex items-center justify-between gap-2">
              <h1 className="font-display text-2xl text-brand">שיחה עם {otherSide}</h1>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap ${statusPillClassName[chat.trip.status]}`}
              >
                {statusLabels[chat.trip.status]}
              </span>
            </div>
            <p className="text-sm text-muted">
              {chat.trip.traveler.name} · {formatDate(chat.trip.startDate)} –{' '}
              {formatDate(chat.trip.endDate)}
            </p>
          </section>

          <MessageList messages={chat.messages} />

          {chat.locked ? (
            <p className={`${cardClassName} text-sm text-muted`}>
              {lockedTexts[chat.trip.status] ?? 'השיחה נסגרה.'}
            </p>
          ) : (
            <SendForm tripId={id} onSent={addSent} lockedText={lockedTexts[chat.trip.status]} />
          )}
        </>
      )}
    </div>
  )
}

function MessageList({ messages }: { messages: ChatMessage[] }) {
  const endRef = useRef<HTMLLIElement>(null)

  // Scroll to the newest message whenever one is added.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  if (messages.length === 0) {
    return <p className={`${cardClassName} text-sm text-muted`}>עוד אין הודעות. אפשר לכתוב ראשונים.</p>
  }

  return (
    <ol aria-label="הודעות" className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
      {messages.map((message) => (
        <li
          key={message.id}
          className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
            message.fromMe
              ? 'self-end rounded-se-sm bg-accent text-on-brand'
              : 'self-start rounded-ss-sm border border-line bg-surface'
          }`}
        >
          <p className="break-words whitespace-pre-wrap">{message.body}</p>
          <p className={`mt-0.5 text-xs ${message.fromMe ? 'opacity-80' : 'text-muted'}`}>
            {formatMessageTime(message.createdAt)}
            {message.fromMe && (message.readAt ? ' · ✓✓ נקראה' : ' · ✓ נשלחה')}
          </p>
        </li>
      ))}
      <li ref={endRef} aria-hidden="true" />
    </ol>
  )
}

function SendForm({
  tripId,
  onSent,
  lockedText,
}: {
  tripId: string
  onSent: (message: ChatMessage) => void
  lockedText?: string
}) {
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!body.trim()) return
    setSending(true)
    setError('')
    try {
      const data = await apiFetch<{ message: ChatMessage }>(`/api/trip-requests/${tripId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body }),
      })
      onSent(data.message)
      setBody('')
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError(lockedText ?? 'השיחה נסגרה או שהטיול השתנה. רעננו את הדף.')
      } else if (err instanceof ApiError && err.status === 400) {
        setError(`ההודעה ריקה או ארוכה מדי (עד ${MAX_MESSAGE_LENGTH.toLocaleString('he-IL')} תווים).`)
      } else {
        setError('ההודעה לא נשלחה. נסו שוב.')
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {error && (
        <p role="alert" className={errorBoxClassName}>
          {error}
        </p>
      )}
      <label htmlFor="chat-body" className="sr-only">
        הודעה
      </label>
      <textarea
        id="chat-body"
        rows={3}
        maxLength={MAX_MESSAGE_LENGTH}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="כתבו הודעה..."
        className={inputClassName}
      />
      <button
        type="submit"
        disabled={sending || !body.trim()}
        className={`w-full ${primaryButtonClassName}`}
      >
        {sending ? 'שולח...' : 'שליחה'}
      </button>
    </form>
  )
}
