import { Check } from 'lucide-react'
import type { ReactNode } from 'react'

type ChoiceChipProps = {
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
  children: ReactNode
}

// A checkbox that looks like a pill. The real <input> stays in the page
// (visually hidden) so keyboards and screen readers still work.
export function ChoiceChip({ checked, disabled = false, onChange, children }: ChoiceChipProps) {
  return (
    <label className="press cursor-pointer rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm select-none has-checked:border-accent has-checked:font-bold has-checked:text-accent has-disabled:cursor-default has-disabled:opacity-60 has-focus-visible:ring-2 has-focus-visible:ring-accent/40">
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      {checked && <><Check className="icon" /> </>}
      {children}
    </label>
  )
}
