import { BrowserRouter, Outlet, Route, Routes } from 'react-router'
import { AuthProvider } from './auth/AuthProvider'
import { useAuth } from './auth/useAuth'
import { UnreadProvider } from './chat/UnreadProvider'
import { AppBar } from './components/AppBar'
import { RequireAuth } from './components/RequireAuth'
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
    <main className="min-h-screen bg-canvas px-4 py-6 text-ink">
      <div className="mx-auto max-w-md space-y-6">
        <AppBar />
        <Outlet />
      </div>
    </main>
  )
}

function AppRoutes() {
  const { loading } = useAuth()

  if (loading) {
    return <p className="min-h-screen bg-canvas pt-6 text-center text-muted">טוען...</p>
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
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
      <AuthProvider>
        <UnreadProvider>
          <AppRoutes />
        </UnreadProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
