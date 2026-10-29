import { ArrowRight, ArrowUp, Check, CheckCheck, Siren, Sparkles } from 'lucide-react'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { useUnread } from '../chat/useUnread'
import { Loading } from '../components/Loading'
import { apiFetch, ApiError } from '../lib/api'
import { formatDate, formatMessageTime } from '../lib/dates'
import { cardClassName, errorBoxClassName, inputClassName, pageTitleClassName } from '../lib/styles'
import { statusPillClassName } from '../trips/format'
import { type ChatMessage, statusLabels, type TripChat } from '../trips/types'

// How often the page asks the server for new messages (polling).
const POLL_EVERY_MS = 5_000
const MAX_MESSAGE_LENGTH = 2000

const lockedTexts: Partial<Record<TripChat['trip']['status'], string>> = {
  COMPLETED:
    "הטיול הסתיים, ואיתו גם הצ'אט נסגר. ההודעות נשארות כאן לקריאה, ולכל שאלה נוספת אפשר להתקשר למדריך.",
  CANCELLED: 'הטיול בוטל, ולכן לא ניתן לשלוח הודעות חדשות. ההודעות הקודמות נשארות כאן לקריאה.',
}

// The chat between the traveler and the guide of one trip. Used by both sides;
// `backTo` is the trip page of whoever is looking.
export function TripChatPage({ backTo }: { backTo: (tripId: string) => string }) {
  const { id = '' } = useParams()
  const { user } = useAuth()
  const { refresh: refreshUnread } = useUnread()
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
          // Loading the chat marked its messages as read, so the counts changed.
          refreshUnread()
        })
        .catch((err) => {
          if (!active) return
          setError(
            err instanceof ApiError && err.status === 404
              ? 'הטיול לא נמצא.'
              : "לא הצלחנו לטעון את הצ'אט. ננסה שוב בעוד רגע.",
          )
        })
    }

    refresh()
    const timer = setInterval(() => {
      if (!document.hidden) refresh()
    }, POLL_EVERY_MS)
    // Coming back to the tab: load right away instead of waiting for the next tick.
    function onVisible() {
      if (!document.hidden) refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      active = false
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [id, refreshUnread])

  function addSent(message: ChatMessage) {
    setChat((prev) => (prev ? { ...prev, messages: [...prev.messages, message] } : prev))
  }

  const otherSide =
    user?.role === 'GUIDE' ? chat?.trip.traveler.name : (chat?.trip.guide?.name ?? 'המדריך')

  return (
    <div className="space-y-4">
      <Link to={backTo(id)} className="text-sm font-semibold text-accent">
        <ArrowRight className="icon" /> חזרה לטיול
      </Link>

      {error && (
        <p role="alert" className={errorBoxClassName}>
          {error}
        </p>
      )}

      {chat === null && !error && <Loading />}

      {chat && (
        <>
          {/* Named like the trip's own header (TravelerTripPage), so opening the chat carries the card over. */}
          <section
            className={`trip-card ${cardClassName} space-y-1`}
            style={{ viewTransitionName: `trip-${id}` }}
          >
            <div className="flex items-center justify-between gap-2">
              <h1 className={pageTitleClassName}>צ'אט עם {otherSide}</h1>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap ${statusPillClassName[chat.trip.status]}`}
                style={{ viewTransitionName: `trip-status-${id}` }}
              >
                {statusLabels[chat.trip.status]}
              </span>
            </div>
            <p className="text-sm text-muted">
              {chat.trip.traveler.name} · {formatDate(chat.trip.startDate)} –{' '}
              {formatDate(chat.trip.endDate)}
            </p>
          </section>

          {/* The guide may not answer right away; in an emergency, 112 is one tap from here too. */}
          {user?.role === 'TRAVELER' && chat.trip.status === 'IN_PROGRESS' && (
            <a
              href="tel:112"
              className="press block rounded-full bg-danger-soft py-3 text-center text-sm font-semibold text-danger"
            >
              <Siren className="icon" /> מקרה חירום? חייגו 112
            </a>
          )}

          <MessageList messages={chat.messages} />

          {chat.locked ? (
            <p className={`${cardClassName} text-sm text-muted`}>
              {lockedTexts[chat.trip.status] ?? "הצ'אט נסגר."}
            </p>
          ) : (
            <SendForm
              tripId={id}
              onSent={addSent}
              lockedText={lockedTexts[chat.trip.status]}
              canSuggest={user?.role === 'GUIDE'}
            />
          )}
        </>
      )}
    </div>
  )
}

function MessageList({ messages }: { messages: ChatMessage[] }) {
  const endRef = useRef<HTMLLIElement>(null)
  // The messages that were there when the chat opened. Only messages added after that
  // rise into place; the history just shows, it didn't "arrive" now.
  const [initialIds] = useState(() => new Set(messages.map((m) => m.id)))

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
          // Like iMessage: yours in blue on the far side, theirs in white; the tail is the one
          // sharper bottom corner. A message that arrives now springs from that corner.
          className={`max-w-[80%] rounded-[20px] px-3.5 py-2 text-[15px] leading-snug ${
            initialIds.has(message.id) ? '' : message.fromMe ? 'bubble-in bubble-in--mine' : 'bubble-in'
          } ${
            message.fromMe
              ? 'self-end rounded-ee-md bg-brand text-on-brand'
              : 'self-start rounded-es-md bg-surface text-ink'
          }`}
        >
          <p className="break-words whitespace-pre-wrap">{message.body}</p>
          <p className={`mt-0.5 text-xs ${message.fromMe ? 'opacity-80' : 'text-muted'}`}>
            {formatMessageTime(message.createdAt)}
            {message.fromMe &&
              (message.readAt ? (
                <> · <CheckCheck className="icon" /> נקראה</>
              ) : (
                <> · <Check className="icon" /> נשלחה</>
              ))}
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
  canSuggest,
}: {
  tripId: string
  onSent: (message: ChatMessage) => void
  lockedText?: string
  // The guide can ask the AI for a draft reply.
  canSuggest: boolean
}) {
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [suggesting, setSuggesting] = useState(false)
  // The text box holds an AI draft the guide hasn't sent yet: say so, so it gets read first.
  const [isDraft, setIsDraft] = useState(false)

  async function suggest() {
    setSuggesting(true)
    setError('')
    try {
      const data = await apiFetch<{ suggestion: string }>(
        `/api/trip-requests/${tripId}/messages/suggestion`,
        { method: 'POST' },
      )
      setBody(data.suggestion)
      setIsDraft(true)
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 503
          ? 'הצעות ה־AI לא מופעלות בשרת.'
          : 'לא הצלחנו להכין הצעה. נסו שוב בעוד רגע.',
      )
    } finally {
      setSuggesting(false)
    }
  }

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
      setIsDraft(false)
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError(lockedText ?? "הצ'אט נסגר או שהטיול השתנה. רעננו את הדף.")
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
      {isDraft && (
        <p className="enter text-xs font-bold text-ai"><Sparkles className="icon" /> טיוטה של AI. קראו, תקנו אם צריך, ורק אז שלחו.</p>
      )}
      {canSuggest && (
        <button
          type="button"
          onClick={suggest}
          disabled={suggesting || sending}
          className={`press rounded-full px-1 text-sm font-semibold text-ai ${suggesting ? 'thinking' : 'disabled:opacity-50'}`}
        >
          <Sparkles className="icon" /> {suggesting ? 'מנסח...' : 'הצעת תשובה'}
        </button>
      )}
      {/* One line like a phone's own messages: the box grows with what you write, up to a few
          lines, and the round send button wakes up once there is something to send. */}
      <div className="flex items-end gap-2">
        <textarea
          id="chat-body"
          rows={1}
          maxLength={MAX_MESSAGE_LENGTH}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="כתבו הודעה..."
          className={`${inputClassName} max-h-40 min-h-11 resize-none rounded-[22px] [field-sizing:content] ${isDraft ? 'border-dashed border-ai' : ''}`}
        />
        <button
          type="submit"
          aria-label={sending ? 'שולח' : 'שליחה'}
          disabled={sending || suggesting || !body.trim()}
          className="press grid size-11 shrink-0 place-items-center rounded-full bg-brand text-on-brand transition-[transform,opacity,background-color] duration-200 hover:bg-brand-hover disabled:scale-90 disabled:opacity-30"
        >
          <ArrowUp className="size-5" strokeWidth={2.5} />
        </button>
      </div>
    </form>
  )
}
