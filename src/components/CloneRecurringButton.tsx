interface Props {
  onClone: () => void
  disabled?: boolean
  loading?: boolean
}

export function CloneRecurringButton({ onClone, disabled, loading }: Props) {
  return (
    <button
      onClick={onClone}
      disabled={disabled || loading}
      className="rounded-md border border-blue bg-blue/10 px-3 py-1.5 font-mono text-xs font-semibold text-blue transition-colors hover:bg-blue/20 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? 'clonando…' : 'clonar recurrentes'}
    </button>
  )
}
