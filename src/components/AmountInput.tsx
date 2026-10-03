import { forwardRef, type InputHTMLAttributes } from 'react'
import { formatAmountInput } from '@/lib/format'

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value: string
  onChange: (value: string) => void
}

/** Monto en CLP con separador de miles mientras se escribe. */
export const AmountInput = forwardRef<HTMLInputElement, Props>(function AmountInput(
  { value, onChange, className = '', ...rest },
  ref,
) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-muted">$</span>
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(formatAmountInput(e.target.value))}
        className={`field amount w-full pl-6 text-right ${className}`}
        {...rest}
      />
    </div>
  )
})
