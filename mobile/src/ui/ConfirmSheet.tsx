import { useState } from 'react'
import { View } from 'react-native'
import { Button } from './Button'
import { Sheet } from './Sheet'

interface Props {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => Promise<void>
  onClose: () => void
}

export function ConfirmSheet({ open, title, description, confirmLabel, onConfirm, onClose }: Props) {
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
    <Sheet open={open} title={title} description={description} onClose={onClose}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
        <Button variant="ghost" onPress={onClose}>Cancelar</Button>
        <Button variant="danger" onPress={handleConfirm} disabled={busy}>
          {busy ? 'Eliminando…' : confirmLabel}
        </Button>
      </View>
    </Sheet>
  )
}
