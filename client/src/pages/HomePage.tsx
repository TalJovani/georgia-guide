import { Link } from 'react-router'
import { useAuth } from '../auth/useAuth'

export function HomePage() {
  const { user, logout } = useAuth()

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">מדריך הטיולים לגיאורגיה</h1>
      <p className="text-stone-600">טיול מותאם אישית, עם מדריך שמכיר כל פינה.</p>

      {user ? (
        <div className="space-y-3 rounded-lg bg-white p-4 shadow-sm">
          <p>
            שלום, <span className="font-medium">{user.name}</span>
          </p>
          {user.role === 'TRAVELER' && (
            <div className="flex gap-3">
              <Link
                to="/trips/new"
                className="flex-1 rounded-lg bg-teal-700 py-2.5 text-center font-medium text-white hover:bg-teal-800"
              >
                בקשת טיול חדשה
              </Link>
              <Link
                to="/trips"
                className="flex-1 rounded-lg border border-stone-300 py-2.5 text-center font-medium hover:bg-stone-100"
              >
                הטיולים שלי
              </Link>
            </div>
          )}
          <button
            type="button"
            onClick={logout}
            className="rounded-lg border border-stone-300 px-4 py-2 text-sm hover:bg-stone-100"
          >
            התנתקות
          </button>
        </div>
      ) : (
        <div className="flex gap-3">
          <Link
            to="/register"
            className="flex-1 rounded-lg bg-teal-700 py-2.5 text-center font-medium text-white hover:bg-teal-800"
          >
            הרשמה
          </Link>
          <Link
            to="/login"
            className="flex-1 rounded-lg border border-stone-300 py-2.5 text-center font-medium hover:bg-stone-100"
          >
            כניסה
          </Link>
        </div>
      )}
    </div>
  )
}
