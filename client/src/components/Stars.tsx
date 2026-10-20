// Read-only stars, e.g. "★★★★☆" for 4. Screen readers hear "4 מתוך 5 כוכבים".
export function Stars({ rating, className = '' }: { rating: number; className?: string }) {
  const full = Math.round(rating)
  return (
    <span role="img" aria-label={`${rating} מתוך 5 כוכבים`} className={`text-ai ${className}`}>
      {'★'.repeat(full)}
      <span className="opacity-30">{'★'.repeat(5 - full)}</span>
    </span>
  )
}

// Picking 1-5 stars. Real radio buttons (visually hidden), so arrows and Tab work too.
export function StarPicker({
  value,
  onChange,
}: {
  value: number
  onChange: (rating: number) => void
}) {
  return (
    <fieldset className="flex justify-center gap-1" dir="ltr">
      <legend className="sr-only">דירוג</legend>
      {[1, 2, 3, 4, 5].map((star) => (
        <label
          key={star}
          className={`cursor-pointer text-4xl leading-none text-ai has-focus-visible:outline-2 has-focus-visible:outline-accent ${star <= value ? '' : 'opacity-30'}`}
        >
          <input
            type="radio"
            name="rating"
            value={star}
            checked={value === star}
            onChange={() => onChange(star)}
            className="sr-only"
          />
          <span aria-hidden="true">★</span>
          <span className="sr-only">{star} כוכבים</span>
        </label>
      ))}
    </fieldset>
  )
}
