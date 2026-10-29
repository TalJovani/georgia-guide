import { useState, type FormEvent } from 'react'
import { ChoiceChip } from '../components/ChoiceChip'
import { FormField } from '../components/FormField'
import { TextField } from '../components/TextField'
import { apiFetch, ApiError } from '../lib/api'
import { todayInIsrael } from '../lib/dates'
import { errorBoxClassName, inputClassName, primaryButtonClassName, pageTitleClassName } from '../lib/styles'
import { useScreenNavigate } from '../lib/useScreenNavigate'
import { kosherLabels, type KosherPreference } from '../trips/types'

// Hebrew messages for fields the server rejected.
const fieldMessages: Record<string, string> = {
  startDate: 'תאריך ההתחלה לא תקין או שהוא בעבר',
  endDate: 'תאריך הסיום חייב להיות אחרי תאריך ההתחלה',
  travelersCount: 'מספר המטיילים צריך להיות בין 1 ל-50',
  budgetMin: 'התקציב צריך להיות מספר שלם וחיובי',
  budgetMax: 'תקציב המקסימום צריך להיות גדול מהמינימום',
  kosher: 'יש לבחור רמת כשרות מהרשימה',
  description: 'התיאור צריך להכיל לפחות 10 תווים',
}

export function NewTripRequestPage() {
  const navigate = useScreenNavigate()
  const today = todayInIsrael()

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [travelersCount, setTravelersCount] = useState('2')
  const [budgetMin, setBudgetMin] = useState('')
  const [budgetMax, setBudgetMax] = useState('')
  const [kosher, setKosher] = useState<KosherPreference>('NONE')
  const [needsFlights, setNeedsFlights] = useState(false)
  const [needsHotels, setNeedsHotels] = useState(false)
  const [needsCarRental, setNeedsCarRental] = useState(false)
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
          ...(budgetMin && { budgetMin: Number(budgetMin) }),
          ...(budgetMax && { budgetMax: Number(budgetMax) }),
          kosher,
          needsFlights,
          needsHotels,
          needsCarRental,
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
        <h1 className={pageTitleClassName}>בקשת טיול חדשה</h1>
        <p className="text-sm text-muted">
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

        <fieldset className="space-y-1">
          <legend className="text-sm font-semibold text-muted">
            תקציב לכל הקבוצה (₪, לא חובה)
          </legend>
          <div className="grid grid-cols-2 gap-3">
            <TextField
              id="budgetMin"
              label="מ־"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              placeholder="12,000"
              value={budgetMin}
              onChange={(e) => setBudgetMin(e.target.value)}
              error={fieldErrors.budgetMin}
            />
            <TextField
              id="budgetMax"
              label="עד"
              type="number"
              inputMode="numeric"
              min={budgetMin || 0}
              step={1}
              placeholder="15,000"
              value={budgetMax}
              onChange={(e) => setBudgetMax(e.target.value)}
              error={fieldErrors.budgetMax}
            />
          </div>
        </fieldset>

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
          <legend className="text-sm font-semibold text-muted">
            מה תרצו שהמדריך יסגור עבורכם?
          </legend>
          <div className="flex flex-wrap gap-2">
            <ChoiceChip
              checked={needsFlights || needsFullPackage}
              disabled={needsFullPackage}
              onChange={setNeedsFlights}
            >
              טיסות
            </ChoiceChip>
            <ChoiceChip
              checked={needsHotels || needsFullPackage}
              disabled={needsFullPackage}
              onChange={setNeedsHotels}
            >
              מלונות
            </ChoiceChip>
            <ChoiceChip checked={needsCarRental} onChange={setNeedsCarRental}>
              רכב שכור
            </ChoiceChip>
            <ChoiceChip checked={needsFullPackage} onChange={setNeedsFullPackage}>
              טיול מקיף
            </ChoiceChip>
          </div>
          <p className="text-xs text-muted">
            טיול מקיף כולל טיסה, מקומות לינה, אטרקציות ומקומות בילוי.
          </p>
        </fieldset>

        <FormField id="description" label="ספרו לנו על הטיול" error={fieldErrors.description}>
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
          <p role="alert" className={errorBoxClassName}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className={`${primaryButtonClassName} w-full`}
        >
          {submitting ? 'שולחים...' : 'שליחה למדריך'}
        </button>
      </form>
    </div>
  )
}
