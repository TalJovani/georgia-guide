import { Link } from 'react-router'
import { useAuth } from '../auth/useAuth'

export function AppBar() {
  const { user, logout } = useAuth()

  return (
    <header className="flex items-center justify-between gap-3 border-b border-line pb-3">
      <Link to="/" className="font-display text-xl text-brand">
        סקרטלו טריפס
      </Link>
      {user && (
        <nav className="flex items-center gap-4 text-sm font-semibold">
          <Link to="/account" className="text-ink hover:text-brand">
            החשבון שלי
          </Link>
          <button type="button" onClick={logout} className="text-muted hover:text-brand">
            התנתקות
          </button>
        </nav>
      )}
    </header>
  )
}
