import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { homePath } from '../auth/context'
import { useAuth } from '../auth/useAuth'
import { TextField } from '../components/TextField'
import { ApiError } from '../lib/api'
import { errorBoxClassName, primaryButtonClassName, pageTitleClassName } from '../lib/styles'
import { useScreenNavigate } from '../lib/useScreenNavigate'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useScreenNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const user = await login(email, password)
      navigate(homePath(user.role), { replace: true })
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? 'אימייל או סיסמה שגויים'
          : 'משהו השתבש, נסו שוב',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className={pageTitleClassName}>כניסה</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
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
        <TextField
          id="password"
          label="סיסמה"
          type="password"
          dir="ltr"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p role="alert" className={errorBoxClassName}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className={`${primaryButtonClassName} w-full`}
        >
          {submitting ? 'נכנסים...' : 'כניסה'}
        </button>
      </form>

      <p className="text-center text-sm">
        אין לך חשבון?{' '}
        <Link to="/register" className="font-bold text-accent underline">
          להרשמה
        </Link>
      </p>
    </div>
  )
}
