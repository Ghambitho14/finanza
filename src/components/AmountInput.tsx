import { forwardRef, type InputHTMLAttributes } from 'react'
import { formatAmountInput } from '@/lib/format'

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type' | 'size'> {
  value: string
  onChange: (value: string) => void
  /** `lg`: monto protagonista del formulario de movimiento. */
  size?: 'md' | 'lg'
}

/** Monto en CLP con separador de miles mientras se escribe. */
export const AmountInput = forwardRef<HTMLInputElement, Props>(function AmountInput(
  { value, onChange, className = '', size = 'md', ...rest },
  ref,
) {
  const large = size === 'lg'
  return (
    <div className="relative">
      <span
        className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-ink-muted ${large ? 'left-4 text-2xl' : 'left-3 text-sm'}`}
      >
        $
      </span>
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(formatAmountInput(e.target.value))}
        className={`field amount w-full ${
          large ? 'h-16 pl-10 text-left text-3xl font-semibold tracking-tight sm:h-16' : 'pl-6 text-right'
        } ${className}`}
        {...rest}
      />
    </div>
  )
})
