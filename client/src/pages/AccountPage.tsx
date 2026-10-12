import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import type { User } from '../auth/context'
import { useAuth } from '../auth/useAuth'
import { TextField } from '../components/TextField'
import { apiFetch, ApiError } from '../lib/api'
import {
  cardClassName,
  dangerButtonClassName,
  errorBoxClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  successBoxClassName,
} from '../lib/styles'

export function AccountPage() {
  // RequireAuth guarantees a user here.
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-brand">החשבון שלי</h1>
      <ProfileSection user={user!} />
      <PasswordSection />
      <DeleteAccountSection />
    </div>
  )
}

function ProfileSection({ user }: { user: User }) {
  const { setUser } = useAuth()
  const [name, setName] = useState(user.name)
  const [phone, setPhone] = useState(user.phone ?? '')
  const [email, setEmail] = useState(user.email)
  const [currentPassword, setCurrentPassword] = useState('')
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const emailChanged = email.trim().toLowerCase() !== user.email

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    setSubmitting(true)
    try {
      const data = await apiFetch<{ user: User }>('/api/account', {
        method: 'PATCH',
        body: JSON.stringify({
          name,
          phone,
          email,
          ...(emailChanged && { currentPassword }),
        }),
      })
      setUser(data.user)
      setEmail(data.user.email)
      setCurrentPassword('')
      setMessage({ ok: true, text: 'הפרטים נשמרו' })
    } catch (err) {
      let text = 'משהו השתבש, נסו שוב'
      if (err instanceof ApiError && err.status === 401) text = 'הסיסמה הנוכחית שגויה'
      if (err instanceof ApiError && err.status === 409) text = 'האימייל הזה כבר רשום לחשבון אחר'
      if (err instanceof ApiError && err.status === 400) text = 'חלק מהפרטים לא תקינים'
      setMessage({ ok: false, text })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className={`${cardClassName} space-y-4`}>
      <h2 className="text-lg font-bold">פרטים אישיים</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField
          id="name"
          label="שם מלא"
          autoComplete="name"
          required
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <TextField
          id="phone"
          label="טלפון"
          type="tel"
          dir="ltr"
          autoComplete="tel"
          maxLength={30}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <TextField
          id="email"
          label="אימייל"
          type="email"
          dir="ltr"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {emailChanged && (
          <TextField
            id="profileCurrentPassword"
            label="כדי לשנות אימייל, הקלידו את הסיסמה הנוכחית"
            type="password"
            dir="ltr"
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        )}

        {message && (
          <p role="status" className={message.ok ? successBoxClassName : errorBoxClassName}>
            {message.text}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className={`${primaryButtonClassName} w-full`}
        >
          {submitting ? 'שומרים...' : 'שמירת פרטים'}
        </button>
      </form>
    </section>
  )
}

function PasswordSection() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    if (newPassword !== confirmPassword) {
      setMessage({ ok: false, text: 'הסיסמה החדשה והאימות שלה לא זהים' })
      return
    }
    setSubmitting(true)
    try {
      await apiFetch<void>('/api/account/password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setMessage({ ok: true, text: 'הסיסמה עודכנה' })
    } catch (err) {
      setMessage({
        ok: false,
        text:
          err instanceof ApiError && err.status === 401
            ? 'הסיסמה הנוכחית שגויה'
            : 'משהו השתבש, נסו שוב',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className={`${cardClassName} space-y-4`}>
      <h2 className="text-lg font-bold">שינוי סיסמה</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField
          id="currentPassword"
          label="סיסמה נוכחית"
          type="password"
          dir="ltr"
          autoComplete="current-password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
        <TextField
          id="newPassword"
          label="סיסמה חדשה (לפחות 8 תווים)"
          type="password"
          dir="ltr"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={72}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <TextField
          id="confirmPassword"
          label="אימות הסיסמה החדשה"
          type="password"
          dir="ltr"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {message && (
          <p role="status" className={message.ok ? successBoxClassName : errorBoxClassName}>
            {message.text}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className={`${secondaryButtonClassName} w-full`}
        >
          {submitting ? 'מעדכנים...' : 'עדכון סיסמה'}
        </button>
      </form>
    </section>
  )
}

function DeleteAccountSection() {
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleDelete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await apiFetch<void>('/api/account', {
        method: 'DELETE',
        body: JSON.stringify({ password }),
      })
      setUser(null)
      navigate('/', { replace: true })
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('הסיסמה שגויה')
      } else if (err instanceof ApiError && err.status === 409) {
        setError('אי אפשר למחוק חשבון בזמן שיש טיול שנסגר או שמתקיים עכשיו. דברו עם המדריך.')
      } else {
        setError('משהו השתבש, נסו שוב')
      }
      setSubmitting(false)
    }
  }

  return (
    <section className="space-y-3 rounded-xl border border-danger/40 p-4">
      <h2 className="text-lg font-bold text-danger">מחיקת חשבון</h2>
      <p className="text-sm text-muted">
        המחיקה סופית: החשבון וכל בקשות הטיול שלכם יימחקו, ואי אפשר לשחזר אותם.
      </p>

      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className={`${dangerButtonClassName} w-full`}
        >
          מחיקת החשבון
        </button>
      ) : (
        <form onSubmit={handleDelete} className="space-y-3">
          <TextField
            id="deletePassword"
            label="כדי לאשר, הקלידו את הסיסמה שלכם"
            type="password"
            dir="ltr"
            autoComplete="current-password"
            required
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <p role="alert" className={errorBoxClassName}>
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className={`${dangerButtonClassName} flex-1 bg-danger text-on-brand hover:bg-danger`}
            >
              {submitting ? 'מוחקים...' : 'מחיקה לצמיתות'}
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirming(false)
                setPassword('')
                setError('')
              }}
              className={`${secondaryButtonClassName} flex-1`}
            >
              ביטול
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
