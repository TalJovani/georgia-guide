import { BrowserRouter, Route, Routes } from 'react-router'
import { AuthProvider } from './auth/AuthProvider'
import { useAuth } from './auth/useAuth'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
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
