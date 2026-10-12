import { useEffect, useState } from 'react'

function App() {
  const [status, setStatus] = useState('loading...')

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setStatus(data.status))
      .catch(() => setStatus('error'))
  }, [])

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-8 text-stone-800">
      <div className="mx-auto max-w-md space-y-4">
        <h1 className="text-3xl font-bold">מדריך הטיולים לגיאורגיה</h1>
        <p className="text-stone-600">
          טיול מותאם אישית, עם מדריך שמכיר כל פינה.
        </p>
        <p className="rounded-lg bg-white p-3 text-sm shadow-sm">
          מצב השרת: <span className="font-medium">{status}</span>
        </p>
      </div>
    </main>
  )
}

export default App
