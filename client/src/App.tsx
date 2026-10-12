import { BrowserRouter, Route, Routes } from 'react-router'
import { AuthProvider } from './auth/AuthProvider'
import { useAuth } from './auth/useAuth'
import { RequireAuth } from './components/RequireAuth'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { MyTripsPage } from './pages/MyTripsPage'
import { NewTripRequestPage } from './pages/NewTripRequestPage'
import { RegisterPage } from './pages/RegisterPage'

function AppRoutes() {
  const { loading } = useAuth()

  if (loading) {
    return <p className="text-center text-stone-500">טוען...</p>
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/trips"
        element={
          <RequireAuth>
            <MyTripsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/trips/new"
        element={
          <RequireAuth>
            <NewTripRequestPage />
          </RequireAuth>
        }
      />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <main className="min-h-screen bg-stone-50 px-4 py-8 text-stone-800">
          <div className="mx-auto max-w-md">
            <AppRoutes />
          </div>
        </main>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
