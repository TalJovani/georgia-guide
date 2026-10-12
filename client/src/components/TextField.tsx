import type { InputHTMLAttributes } from 'react'
import { inputClassName } from '../lib/styles'
import { FormField } from './FormField'

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string
  label: string
  error?: string | undefined
}

export function TextField({ label, id, error, ...inputProps }: TextFieldProps) {
  return (
    <FormField id={id} label={label} error={error}>
      <input
        id={id}
        className={inputClassName}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...inputProps}
      />
    </FormField>
  )
}
