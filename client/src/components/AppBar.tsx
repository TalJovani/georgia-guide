import { Link } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { useUnread } from '../chat/useUnread'
import { UnreadBadge } from './UnreadBadge'

export function AppBar() {
  const { user, logout } = useAuth()
  const { total } = useUnread()

  return (
    <header className="flex items-center justify-between gap-3 border-b border-line pb-3">
      <Link to="/" className="font-display text-xl text-brand">
        Georgia Trips
      </Link>
      {user && (
        <nav className="flex items-center gap-4 text-sm font-semibold">
          {total > 0 && (
            <Link
              to={user.role === 'GUIDE' ? '/guide' : '/trips'}
              className="flex items-center gap-1 text-brand"
            >
              ✉ <UnreadBadge count={total} />
            </Link>
          )}
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
