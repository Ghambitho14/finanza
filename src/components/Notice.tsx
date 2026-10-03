export interface NoticeMessage {
  kind: 'error' | 'info'
  text: string
}

interface Props {
  notice: NoticeMessage | null
  onDismiss: () => void
}

export function Notice({ notice, onDismiss }: Props) {
  if (!notice) return null

  const isError = notice.kind === 'error'

  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={`mb-5 flex items-start justify-between gap-3 rounded-md border px-4 py-2.5 font-mono text-xs ${
        isError ? 'border-red bg-red-bg text-red' : 'border-green bg-green-bg text-green'
      }`}
    >
      <span>
        <span className="font-semibold">{isError ? 'error:' : 'ok:'}</span> {notice.text}
      </span>
      <button
        onClick={onDismiss}
        className="text-txt-tertiary transition-colors hover:text-txt-primary"
        aria-label="Cerrar aviso"
      >
        ×
      </button>
    </div>
  )
}
