import { Link } from 'react-router'
import { useAuth } from '../auth/useAuth'

export function AppBar() {
  const { user, logout } = useAuth()

  return (
    <header className="flex items-center justify-between border-b border-line pb-3">
      <Link to="/" className="font-display text-xl text-brand">
        סקרטלו טריפס
      </Link>
      {user && (
        <button
          type="button"
          onClick={logout}
          className="text-sm font-semibold text-muted hover:text-brand"
        >
          התנתקות
        </button>
      )}
    </header>
  )
}
