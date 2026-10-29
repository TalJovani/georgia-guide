import type { ReactNode } from 'react'

type FormFieldProps = {
  id: string
  label: string
  error?: string | undefined
  children: ReactNode
}

export function FormField({ id, label, error, children }: FormFieldProps) {
  return (
    // min-w-0: in a grid of two fields, each may shrink to its column instead of to its content.
    <div className="min-w-0 space-y-1">
      <label htmlFor={id} className="block text-sm font-semibold text-muted">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
