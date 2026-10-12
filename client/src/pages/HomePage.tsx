import { Link } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { cardClassName, primaryButtonClassName, secondaryButtonClassName } from '../lib/styles'

export function HomePage() {
  const { user } = useAuth()

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h1 className="font-display text-3xl text-balance text-brand">
          טיול לגיאורגיה, עם מדריך שמכיר כל פינה
        </h1>
        <p className="text-muted">
          ספרו לנו מה אתם אוהבים, והמדריך יבנה לכם מסלול אישי וילווה אתכם לאורך כל הטיול.
        </p>
      </div>

      {user ? (
        <div className={`${cardClassName} space-y-3`}>
          <p>
            שלום, <span className="font-bold">{user.name}</span>
          </p>
          {user.role === 'TRAVELER' && (
            <div className="flex gap-3">
              <Link to="/trips/new" className={`${primaryButtonClassName} flex-1`}>
                בקשת טיול חדשה
              </Link>
              <Link to="/trips" className={`${secondaryButtonClassName} flex-1`}>
                הטיולים שלי
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="flex gap-3">
          <Link to="/register" className={`${primaryButtonClassName} flex-1`}>
            הרשמה
          </Link>
          <Link to="/login" className={`${secondaryButtonClassName} flex-1`}>
            כניסה
          </Link>
        </div>
      )}
    </div>
  )
}
