import { BrowserRouter, Route, Routes } from 'react-router'
import { AuthProvider } from './auth/AuthProvider'
import { useAuth } from './auth/useAuth'
import { AppBar } from './components/AppBar'
import { RequireAuth } from './components/RequireAuth'
import { GuideDashboardPage } from './pages/GuideDashboardPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { MyTripsPage } from './pages/MyTripsPage'
import { NewTripRequestPage } from './pages/NewTripRequestPage'
import { RegisterPage } from './pages/RegisterPage'

function AppRoutes() {
  const { loading } = useAuth()

  if (loading) {
    return <p className="text-center text-muted">טוען...</p>
  }

  return (
    <>
      <AppBar />
      <Routes>
        <Route path="/" element={<HomePage />} />
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
          path="/guide"
          element={
            <RequireAuth role="GUIDE">
              <GuideDashboardPage />
            </RequireAuth>
          }
        />
      </Routes>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <main className="min-h-screen bg-canvas px-4 py-6 text-ink">
          <div className="mx-auto max-w-md space-y-6">
            <AppRoutes />
          </div>
        </main>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
