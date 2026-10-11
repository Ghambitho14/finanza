import { useEffect, useState, type ReactNode } from 'react'
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { X } from 'lucide-react-native'
import { createStyles } from '@/lib/theme'
import { IconButton } from './Button'
import { Text } from './Text'
import { ToastViewport } from './Toaster'

interface Props {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
  /** Barra fija al pie (botones de guardar), fuera del scroll. */
  footer?: ReactNode
}

const absoluteFill = { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 } as const

const useStyles = createStyles((c) => ({
  backdrop: { ...absoluteFill, backgroundColor: 'rgba(0, 0, 0, 0.6)' },
  sheet: {
    backgroundColor: c.surface.DEFAULT,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: c.line.DEFAULT,
  },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: c.line.DEFAULT, marginTop: 12, marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, paddingHorizontal: 20, marginBottom: 16 },
  footer: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: c.line.DEFAULT, backgroundColor: c.surface.DEFAULT },
}))

/**
 * Hoja que sube desde abajo (el Modal de la web en el teléfono). Se cierra con
 * la X, tocando el fondo o con el botón atrás de Android.
 */
export function Sheet({ open, title, description, onClose, children, footer }: Props) {
  const s = useStyles()
  const insets = useSafeAreaInsets()
  const { height } = useWindowDimensions()
  // Sigue montada mientras baja; se desmonta al terminar la animación
  const [mounted, setMounted] = useState(open)
  if (open && !mounted) setMounted(true)
  const [progress] = useState(() => new Animated.Value(0))

  useEffect(() => {
    if (open) {
      Animated.timing(progress, {
        toValue: 1,
        duration: 220,
        easing: Easing.bezier(0.32, 0.72, 0, 1),
        useNativeDriver: true,
      }).start()
    } else if (mounted) {
      Animated.timing(progress, { toValue: 0, duration: 160, useNativeDriver: true }).start(({ finished }) => {
        if (finished) setMounted(false)
      })
    }
  }, [open, mounted, progress])

  if (!mounted) return null

  const bottomPad = Math.max(20, insets.bottom + 8)

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <Animated.View style={[s.backdrop, { opacity: progress }]}>
        <Pressable style={absoluteFill} onPress={onClose} accessibilityLabel="Cerrar" />
      </Animated.View>
      <KeyboardAvoidingView
        behavior="padding"
        style={{ flex: 1, justifyContent: 'flex-end' }}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[
            s.sheet,
            { maxHeight: height * 0.92 - insets.top },
            { transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [height, 0] }) }] },
          ]}
        >
          <View style={s.grabber} />
          <View style={s.header}>
            <View style={{ flex: 1 }}>
              <Text size={16} weight="semibold">{title}</Text>
              {description ? <Text tone="secondary" style={{ marginTop: 4 }}>{description}</Text> : null}
            </View>
            <IconButton icon={X} label="Cerrar" onPress={onClose} style={{ marginRight: -6, marginTop: -4 }} />
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: footer ? 16 : bottomPad }}
          >
            {children}
          </ScrollView>
          {footer ? <View style={[s.footer, { paddingBottom: bottomPad }]}>{footer}</View> : null}
        </Animated.View>
      </KeyboardAvoidingView>
      <ToastViewport placement="top" />
    </Modal>
  )
}
