import { monthOptions, formatMonthLabel } from '@/lib/calculations'

interface Props {
  value: string
  onChange: (month: string) => void
}

export function MonthSelector({ value, onChange }: Props) {
  const options = monthOptions(24)

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Elegir mes"
      className="rounded-md border border-border bg-bg-elevated px-2.5 py-1.5 font-mono text-sm text-txt-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue focus-visible:outline-offset-2"
    >
      {options.map((m) => (
        <option key={m} value={m}>
          🔀 {formatMonthLabel(m)}
        </option>
      ))}
    </select>
  )
}
