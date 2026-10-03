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
    <div className="flex items-center gap-1">
      <button onClick={() => onChange(prevMonth(month))} className="icon-btn" aria-label="Mes anterior">
        <ChevronLeft size={18} />
      </button>
      <h1 className="min-w-[9.5rem] text-center text-lg font-semibold tracking-tight sm:text-xl" aria-live="polite">
        {formatMonthLabel(month)}
      </h1>
      <button onClick={() => onChange(nextMonth(month))} className="icon-btn" aria-label="Mes siguiente">
        <ChevronRight size={18} />
      </button>
      {month !== today && (
        <button onClick={() => onChange(today)} className="btn-ghost ml-1 h-8 px-2.5 text-xs">
          Ir al mes actual
        </button>
      )}
    </div>
  )
}
