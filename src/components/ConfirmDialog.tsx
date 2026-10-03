import { useState } from 'react'
import { Modal } from '@/components/Modal'

interface Props {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => Promise<void>
  onClose: () => void
}

export function ConfirmDialog({ open, title, description, confirmLabel, onConfirm, onClose }: Props) {
  const [busy, setBusy] = useState(false)

  const handleConfirm = async () => {
    setBusy(true)
    try {
      await onConfirm()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} title={title} description={description} onClose={onClose} size="sm">
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="btn-ghost">Cancelar</button>
        <button onClick={handleConfirm} disabled={busy} className="btn-danger">
          {busy ? 'Eliminando…' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
