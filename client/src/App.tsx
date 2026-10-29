import { BrowserRouter, Link, Navigate, Outlet, Route, Routes } from 'react-router'
import { AuthProvider } from './auth/AuthProvider'
import { homePath } from './auth/context'
import { useAuth } from './auth/useAuth'
import { UnreadProvider } from './chat/UnreadProvider'
import { AppBar } from './components/AppBar'
import { RequireAuth } from './components/RequireAuth'
import { ScreenTransitions } from './components/ScreenTransitions'
import { AccountPage } from './pages/AccountPage'
import { GuideDashboardPage } from './pages/GuideDashboardPage'
import { GuideReviewsPage } from './pages/GuideReviewsPage'
import { GuideTripPage } from './pages/GuideTripPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { MyTripsPage } from './pages/MyTripsPage'
import { NewTripRequestPage } from './pages/NewTripRequestPage'
import { RegisterPage } from './pages/RegisterPage'
import { TravelerTripPage } from './pages/TravelerTripPage'
import { TripChatPage } from './pages/TripChatPage'

// The app's own screens: one narrow column under the app bar.
// The landing page is not in here: it is a full-width page with its own header.
function AppLayout() {
  return (
    <main className="min-h-screen bg-canvas px-4 pb-10 text-ink">
      <div className="mx-auto max-w-md space-y-6">
        <AppBar />
        <Outlet />
        <footer className="pt-6 text-center text-sm">
          <Link to="/about" className="text-muted transition-colors duration-150 hover:text-accent">
            על מיקי ו־Georgia Trips
          </Link>
        </footer>
      </div>
    </main>
  )
}

// The front door. Visitors get the landing page; someone already signed in has seen it, so they
// go straight to their own page. The landing page stays open to everyone at /about.
function FrontDoor() {
  const { user } = useAuth()
  return user ? <Navigate to={homePath(user.role)} replace /> : <HomePage />
}

function AppRoutes() {
  const { loading } = useAuth()

  if (loading) {
    return <p className="min-h-screen bg-canvas pt-6 text-center text-muted">טוען...</p>
  }

  return (
    <Routes>
      <Route path="/" element={<FrontDoor />} />
      <Route path="/about" element={<HomePage />} />
      <Route element={<AppLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/trips"
          element={
            <RequireAuth role="TRAVELER">
              <MyTripsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/trips/new"
          element={
            <RequireAuth role="TRAVELER">
              <NewTripRequestPage />
            </RequireAuth>
          }
        />
        <Route
          path="/trips/:id"
          element={
            <RequireAuth role="TRAVELER">
              <TravelerTripPage />
            </RequireAuth>
          }
        />
        <Route
          path="/trips/:id/chat"
          element={
            <RequireAuth role="TRAVELER">
              <TripChatPage backTo={(tripId) => `/trips/${tripId}`} />
            </RequireAuth>
          }
        />
        <Route
          path="/account"
          element={
            <RequireAuth>
              <AccountPage />
            </RequireAuth>
          }
        />
        <Route
          path="/guide"
          element={
            <RequireAuth role="GUIDE">
              <GuideDashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/guide/trips/:id"
          element={
            <RequireAuth role="GUIDE">
              <GuideTripPage />
            </RequireAuth>
          }
        />
        <Route
          path="/guide/reviews"
          element={
            <RequireAuth role="GUIDE">
              <GuideReviewsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/guide/trips/:id/chat"
          element={
            <RequireAuth role="GUIDE">
              <TripChatPage backTo={(tripId) => `/guide/trips/${tripId}`} />
            </RequireAuth>
          }
        />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ScreenTransitions />
      <AuthProvider>
        <UnreadProvider>
          <AppRoutes />
        </UnreadProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
