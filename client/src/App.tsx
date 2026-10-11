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
    <main>
      <h1>מדריך הטיולים לגיאורגיה</h1>
      <p>Server status: {status}</p>
    </main>
  )
}

export default App
