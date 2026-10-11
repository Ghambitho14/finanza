import { ChevronLeft, ChevronRight } from 'lucide-react'
import { currentMonth, nextMonth, prevMonth } from '@/lib/calculations'
import { formatMonthLabel } from '@/lib/format'

interface Props {
  month: string
  onChange: (month: string) => void
}

export function MonthNav({ month, onChange }: Props) {
  const today = currentMonth()

  return (
    <div className="flex items-center gap-2">
      {month !== today && (
        <button onClick={() => onChange(today)} className="btn-ghost px-2.5 text-xs">
          Ir al mes actual
        </button>
      )}
      <div className="flex items-center rounded-lg border border-line bg-surface p-0.5">
        <button onClick={() => onChange(prevMonth(month))} className="icon-btn" aria-label="Mes anterior">
          <ChevronLeft size={18} />
        </button>
        <span className="min-w-[8.5rem] text-center text-sm font-semibold" aria-live="polite">
          {formatMonthLabel(month)}
        </span>
        <button onClick={() => onChange(nextMonth(month))} className="icon-btn" aria-label="Mes siguiente">
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}
