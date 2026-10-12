import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { TextField } from '../components/TextField'
import { ApiError } from '../lib/api'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await register({ name, email, password, ...(phone && { phone }) })
      navigate('/')
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('האימייל הזה כבר רשום. אפשר להיכנס במקום.')
      } else if (err instanceof ApiError && err.status === 400) {
        setError('חלק מהפרטים לא תקינים. בדקו את השדות ונסו שוב.')
      } else {
        setError('משהו השתבש, נסו שוב')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">הרשמה</h1>

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
          id="phone"
          label="טלפון (לא חובה)"
          type="tel"
          dir="ltr"
          autoComplete="tel"
          maxLength={30}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <TextField
          id="password"
          label="סיסמה (לפחות 8 תווים)"
          type="password"
          dir="ltr"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={72}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-teal-700 py-2.5 font-medium text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {submitting ? 'נרשמים...' : 'הרשמה'}
        </button>
      </form>

      <p className="text-center text-sm">
        כבר יש לך חשבון?{' '}
        <Link to="/login" className="font-medium text-teal-700 underline">
          לכניסה
        </Link>
      </p>
    </div>
  )
}
