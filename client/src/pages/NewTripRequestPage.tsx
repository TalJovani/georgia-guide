import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { FormField } from '../components/FormField'
import { TextField } from '../components/TextField'
import { apiFetch, ApiError } from '../lib/api'
import { todayInIsrael } from '../lib/dates'
import { inputClassName } from '../lib/styles'
import { kosherLabels, type KosherPreference } from '../trips/types'

// Hebrew messages for fields the server rejected.
const fieldMessages: Record<string, string> = {
  startDate: 'תאריך ההתחלה לא תקין או שהוא בעבר',
  endDate: 'תאריך הסיום חייב להיות אחרי תאריך ההתחלה',
  travelersCount: 'מספר המטיילים צריך להיות בין 1 ל-50',
  budget: 'התקציב צריך להיות מספר שלם וחיובי',
  kosher: 'יש לבחור רמת כשרות מהרשימה',
  description: 'התיאור צריך להכיל לפחות 10 תווים',
}

export function NewTripRequestPage() {
  const navigate = useNavigate()
  const today = todayInIsrael()

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [travelersCount, setTravelersCount] = useState('2')
  const [budget, setBudget] = useState('')
  const [kosher, setKosher] = useState<KosherPreference>('NONE')
  const [needsFlights, setNeedsFlights] = useState(false)
  const [needsHotels, setNeedsHotels] = useState(false)
  const [needsFullPackage, setNeedsFullPackage] = useState(false)
  const [description, setDescription] = useState('')

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setFieldErrors({})
    setSubmitting(true)

    try {
      await apiFetch('/api/trip-requests', {
        method: 'POST',
        body: JSON.stringify({
          startDate,
          endDate,
          travelersCount: Number(travelersCount),
          ...(budget && { budget: Number(budget) }),
          kosher,
          needsFlights,
          needsHotels,
          needsFullPackage,
          description,
        }),
      })
      navigate('/trips')
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        const messages: Record<string, string> = {}
        for (const field of Object.keys(err.fieldErrors)) {
          messages[field] = fieldMessages[field] ?? 'ערך לא תקין'
        }
        setFieldErrors(messages)
        setError('חלק מהפרטים לא תקינים. בדקו את השדות המסומנים.')
      } else {
        setError('משהו השתבש, נסו שוב')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">בקשת טיול חדשה</h1>
        <p className="text-sm text-stone-600">
          ספרו לנו על הטיול שאתם מדמיינים, והמדריך יחזור אליכם עם מסלול מותאם.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <TextField
            id="startDate"
            label="תאריך התחלה"
            type="date"
            dir="ltr"
            required
            min={today}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            error={fieldErrors.startDate}
          />
          <TextField
            id="endDate"
            label="תאריך סיום"
            type="date"
            dir="ltr"
            required
            min={startDate || today}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            error={fieldErrors.endDate}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <TextField
            id="travelersCount"
            label="מספר מטיילים"
            type="number"
            inputMode="numeric"
            required
            min={1}
            max={50}
            step={1}
            value={travelersCount}
            onChange={(e) => setTravelersCount(e.target.value)}
            error={fieldErrors.travelersCount}
          />
          <TextField
            id="budget"
            label="תקציב כולל (₪)"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            placeholder="לא חובה"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            error={fieldErrors.budget}
          />
        </div>

        <FormField id="kosher" label="כשרות" error={fieldErrors.kosher}>
          <select
            id="kosher"
            className={inputClassName}
            value={kosher}
            onChange={(e) => setKosher(e.target.value as KosherPreference)}
          >
            {Object.entries(kosherLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </FormField>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">מה תרצו שהמדריך יסגור עבורכם?</legend>
          <label className="flex items-center gap-2 has-disabled:text-stone-400">
            <input
              type="checkbox"
              className="size-4 accent-teal-700"
              checked={needsFlights || needsFullPackage}
              disabled={needsFullPackage}
              onChange={(e) => setNeedsFlights(e.target.checked)}
            />
            טיסות
          </label>
          <label className="flex items-center gap-2 has-disabled:text-stone-400">
            <input
              type="checkbox"
              className="size-4 accent-teal-700"
              checked={needsHotels || needsFullPackage}
              disabled={needsFullPackage}
              onChange={(e) => setNeedsHotels(e.target.checked)}
            />
            מלונות
          </label>
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              className="mt-1 size-4 shrink-0 accent-teal-700"
              checked={needsFullPackage}
              onChange={(e) => setNeedsFullPackage(e.target.checked)}
            />
            <span>
              טיול מקיף
              <span className="block text-sm text-stone-500">
                טיסה, מקומות לינה, אטרקציות ומקומות בילוי
              </span>
            </span>
          </label>
        </fieldset>

        <FormField id="description" label="ספרו על הטיול" error={fieldErrors.description}>
          <textarea
            id="description"
            className={inputClassName}
            rows={5}
            required
            minLength={10}
            maxLength={5000}
            placeholder="לדוגמה: זוג בירח דבש, אוהבים מסעדות, נופים וקניות. לא אוהבים נסיעות ארוכות."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            aria-invalid={fieldErrors.description ? true : undefined}
            aria-describedby={fieldErrors.description ? 'description-error' : undefined}
          />
        </FormField>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-teal-700 py-2.5 font-medium text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {submitting ? 'שולחים...' : 'שליחת הבקשה'}
        </button>
      </form>
    </div>
  )
}
