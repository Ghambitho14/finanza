import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { Animated, Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react-native'
import { useTheme } from '@/lib/theme'
import { IconButton } from './Button'
import { Text } from './Text'

type ToastKind = 'success' | 'error' | 'info'

export interface ToastOptions {
  kind?: ToastKind
  text: string
  action?: { label: string; onClick: () => void }
}

interface Toast extends ToastOptions {
  id: number
  kind: ToastKind
}

interface ToastState {
  show: (options: ToastOptions) => void
  toasts: Toast[]
  dismiss: (id: number) => void
  /** Espacio que ocupa abajo la barra de pestañas (los avisos van encima). */
  bottomInset: number
  setBottomInset: (px: number) => void
}

const ToastContext = createContext<ToastState | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [bottomInset, setBottomInset] = useState(0)
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const show = useCallback((options: ToastOptions) => {
    const id = nextId.current++
    const kind = options.kind ?? 'success'
    setToasts((list) => [...list.slice(-2), { ...options, kind, id }])
    // Los errores y los avisos con "deshacer" se quedan más tiempo
    const duration = kind === 'error' || options.action ? 7000 : 4000
    setTimeout(() => dismiss(id), duration)
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ show, toasts, dismiss, bottomInset, setBottomInset }}>
      {children}
      <ToastViewport />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider')
  return ctx.show
}

/** La barra de pestañas reserva su alto mientras está montada. */
export function useToastBottomInset(px: number) {
  const ctx = useContext(ToastContext)
  const set = ctx?.setBottomInset
  useEffect(() => {
    set?.(px)
    return () => set?.(0)
  }, [set, px])
}

/**
 * Lista de avisos. La raíz pinta una abajo; las hojas (Modal) pintan otra
 * arriba, porque un Modal tapa todo lo que está debajo.
 */
export function ToastViewport({ placement = 'bottom' }: { placement?: 'top' | 'bottom' }) {
  const ctx = useContext(ToastContext)
  const insets = useSafeAreaInsets()
  if (!ctx || ctx.toasts.length === 0) return null
  const edge = placement === 'bottom'
    ? { bottom: Math.max(insets.bottom, 16) + ctx.bottomInset + 8 }
    : { top: insets.top + 12 }
  return (
    <View pointerEvents="box-none" style={[{ position: 'absolute', left: 16, right: 16, gap: 8, alignItems: 'center' }, edge]}>
      {ctx.toasts.map((t) => <ToastItem key={t.id} toast={t} onDismiss={() => ctx.dismiss(t.id)} />)}
    </View>
  )
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const { palette: c } = useTheme()
  const [appear] = useState(() => new Animated.Value(0))
  useEffect(() => {
    Animated.timing(appear, { toValue: 1, duration: 160, useNativeDriver: true }).start()
  }, [appear])

  const icon = {
    success: <CircleCheck size={16} color={c.status.good} />,
    error: <CircleAlert size={16} color={c.status.critical} />,
    info: <Info size={16} color={c.accent} />,
  }[toast.kind]

  return (
    <Animated.View
      accessibilityRole={toast.kind === 'error' ? 'alert' : undefined}
      accessibilityLiveRegion="polite"
      style={{
        width: '100%',
        maxWidth: 448,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingLeft: 14,
        paddingRight: 6,
        paddingVertical: 6,
        minHeight: 44,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: c.line.DEFAULT,
        backgroundColor: c.surface.raised,
        elevation: 8,
        opacity: appear,
        transform: [{ translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
      }}
    >
      {icon}
      <Text style={{ flex: 1 }}>{toast.text}</Text>
      {toast.action && (
        <Pressable
          onPress={() => {
            toast.action!.onClick()
            onDismiss()
          }}
          style={({ pressed }) => ({ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: pressed ? c.surface.hover : 'transparent' })}
        >
          <Text weight="semibold" color={c.accent}>{toast.action.label}</Text>
        </Pressable>
      )}
      <IconButton icon={X} size={14} label="Cerrar aviso" onPress={onDismiss} style={{ width: 28, height: 28 }} />
    </Animated.View>
  )
}
