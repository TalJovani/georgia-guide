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
    <label className="press cursor-pointer rounded-full bg-surface px-4 py-2 text-sm select-none has-checked:bg-brand has-checked:font-semibold has-checked:text-on-brand has-disabled:cursor-default has-disabled:opacity-50 has-focus-visible:ring-4 has-focus-visible:ring-brand/25">
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      {checked && <><Check className="icon pop" /> </>}
      {children}
    </label>
  )
}
