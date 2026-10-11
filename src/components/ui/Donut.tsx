import { useState, type ReactNode } from 'react'
import { formatCLP, formatPercent } from '@/lib/format'

export interface DonutSegment {
  key: string
  label: string
  value: number
  /** Clase de trazo SVG (p. ej. `stroke-chart-1`). */
  stroke: string
}

interface Props {
  segments: DonutSegment[]
  /** Contenido del centro cuando no hay un segmento señalado. */
  center: ReactNode
  /** Segmento resaltado desde fuera (al pasar por la leyenda). */
  activeKey?: string | null
  onActiveChange?: (key: string | null) => void
  size?: number
}

const THICKNESS = 14
/** Hueco entre segmentos, del color de la tarjeta. */
const GAP = 2

/** Dona en SVG puro: cada segmento es un arco del mismo círculo. */
export function Donut({ segments, center, activeKey, onActiveChange, size = 168 }: Props) {
  const [hovered, setHovered] = useState<string | null>(null)
  const active = activeKey ?? hovered
  const setActive = (key: string | null) => {
    setHovered(key)
    onActiveChange?.(key)
  }

  const total = segments.reduce((s, x) => s + x.value, 0)
  const r = (size - THICKNESS) / 2
  const circumference = 2 * Math.PI * r
  const gap = segments.length > 1 ? GAP : 0
  const activeSegment = segments.find((s) => s.key === active)

  let offset = 0
  const arcs = segments.map((s) => {
    const length = total > 0 ? (s.value / total) * circumference : 0
    const arc = { ...s, dash: Math.max(length - gap, 0.5), offset }
    offset += length
    return arc
  })

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={THICKNESS} className="stroke-surface-hover" />
        {arcs.map((a) => (
          <circle
            key={a.key}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={active === a.key ? THICKNESS + 4 : THICKNESS}
            strokeDasharray={`${a.dash} ${circumference - a.dash}`}
            strokeDashoffset={-a.offset}
            className={`${a.stroke} cursor-pointer transition-[stroke-width,opacity] duration-150 ${
              active && active !== a.key ? 'opacity-40' : ''
            }`}
            onPointerEnter={() => setActive(a.key)}
            onPointerLeave={() => setActive(null)}
          />
        ))}
      </svg>
      <div className="pointer-events-none absolute inset-0 grid place-items-center p-6 text-center">
        {activeSegment ? (
          <div>
            <p className="truncate text-xs text-ink-secondary">{activeSegment.label}</p>
            <p className="amount mt-0.5 text-base font-semibold">{formatCLP(activeSegment.value)}</p>
            <p className="text-xs text-ink-muted">{total > 0 ? formatPercent(activeSegment.value / total) : ''}</p>
          </div>
        ) : (
          center
        )}
      </div>
    </div>
  )
}
