import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { router } from 'expo-router'
import type { BottomTabBarProps } from 'expo-router/js-tabs'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as WebBrowser from 'expo-web-browser'
import {
  ArrowLeftRight,
  ChartColumn,
  LayoutDashboard,
  LogOut,
  Monitor,
  Moon,
  Plus,
  ShieldCheck,
  Sun,
  Tags,
  Trash2,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native'
import { withAlpha } from '@shared/theme'
import { DELETE_DATA_COPY, PRIVACY_PATH } from '@shared/legal'
import { api, errorMessage } from '@/lib/api'
import { authErrorMessage, useAuth } from '@/lib/auth'
import { WEB_URL } from '@/lib/env'
import { useTheme, type ThemePreference } from '@/lib/theme'
import { ConfirmSheet } from '@/ui/ConfirmSheet'
import { Sheet } from '@/ui/Sheet'
import { Text } from '@/ui/Text'
import { useToast } from '@/ui/Toaster'
import { useTransactionEditor } from './TransactionEditor'

export const NAV: Record<string, { label: string; icon: LucideIcon }> = {
  index: { label: 'Resumen', icon: LayoutDashboard },
  movimientos: { label: 'Movimientos', icon: ArrowLeftRight },
  historico: { label: 'Histórico', icon: ChartColumn },
  categorias: { label: 'Categorías', icon: Tags },
}

/** Alto de la barra inferior sin el área segura. */
export const TAB_BAR_HEIGHT = 64

/** Logo y nombre de la app. */
export function Brand({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const { palette: c } = useTheme()
  const tile = size === 'lg' ? 44 : 32
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ width: tile, height: tile, borderRadius: size === 'lg' ? 12 : 8, backgroundColor: c.ink.DEFAULT, alignItems: 'center', justifyContent: 'center' }}>
        <Wallet size={size === 'lg' ? 20 : 16} strokeWidth={2.25} color={c.page} />
      </View>
      {size === 'md' && <Text size={15} weight="semibold" tight>Finanzas</Text>}
    </View>
  )
}

/** Barra superior: logo y cuenta. */
export function TopBar() {
  const { palette: c } = useTheme()
  const insets = useSafeAreaInsets()
  const { session } = useAuth()
  const [menu, setMenu] = useState(false)
  const email = session?.user.email ?? ''

  return (
    <View style={{ paddingTop: insets.top, backgroundColor: c.page, borderBottomWidth: 1, borderBottomColor: c.line.muted }}>
      <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 }}>
        <Pressable onPress={() => router.navigate('/')} accessibilityLabel="Ir al resumen">
          <Brand />
        </Pressable>
        <Pressable
          onPress={() => setMenu(true)}
          accessibilityRole="button"
          accessibilityLabel="Cuenta"
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
        >
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: withAlpha(c.accent, 0.15), alignItems: 'center', justifyContent: 'center' }}>
            <Text size={14} weight="semibold" color={c.accent}>{(email.charAt(0) || '?').toUpperCase()}</Text>
          </View>
        </Pressable>
      </View>
      <AccountSheet open={menu} onClose={() => setMenu(false)} email={email} />
    </View>
  )
}

const THEMES: { value: ThemePreference; label: string; icon: LucideIcon }[] = [
  { value: 'system', label: 'Sistema', icon: Monitor },
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Oscuro', icon: Moon },
]

/** El menú de cuenta de la web: tema, privacidad, borrar datos y salir. */
function AccountSheet({ open, onClose, email }: { open: boolean; onClose: () => void; email: string }) {
  const { palette: c, preference, setPreference } = useTheme()
  const { signOut } = useAuth()
  const toast = useToast()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (err) {
      toast({ kind: 'error', text: authErrorMessage(err) })
    }
  }

  const handleDeleteData = async () => {
    try {
      await api.account.deleteData()
    } catch (err) {
      toast({ kind: 'error', text: errorMessage(err, DELETE_DATA_COPY.error) })
      return
    }
    setConfirmDelete(false)
    toast({ text: DELETE_DATA_COPY.done })
    await signOut().catch(() => {})
  }

  return (
    <>
      <Sheet open={open} title="Tu cuenta" description={email} onClose={onClose}>
        <Text size={12} weight="medium" tone="secondary" style={{ marginBottom: 6 }}>Tema</Text>
        <View style={{ flexDirection: 'row', gap: 4, borderRadius: 8, borderWidth: 1, borderColor: c.line.DEFAULT, backgroundColor: c.surface.raised, padding: 2 }}>
          {THEMES.map(({ value, label, icon: Icon }) => {
            const active = preference === value
            return (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setPreference(value)}
                style={{ flex: 1, alignItems: 'center', gap: 2, paddingVertical: 8, borderRadius: 6, backgroundColor: active ? c.surface.hover : 'transparent' }}
              >
                <Icon size={16} color={active ? c.ink.DEFAULT : c.ink.secondary} />
                <Text size={12} weight={active ? 'medium' : 'regular'} tone={active ? 'ink' : 'secondary'}>{label}</Text>
              </Pressable>
            )
          })}
        </View>

        <View style={{ height: 1, backgroundColor: c.line.DEFAULT, marginVertical: 12 }} />
        <MenuItem icon={ShieldCheck} label="Política de privacidad" onPress={() => WebBrowser.openBrowserAsync(WEB_URL + PRIVACY_PATH)} />
        <MenuItem
          icon={Trash2}
          label={DELETE_DATA_COPY.action}
          color={c.negative}
          onPress={() => {
            // Una hoja por vez: se cierra el menú antes de confirmar
            onClose()
            setConfirmDelete(true)
          }}
        />
        <MenuItem icon={LogOut} label="Cerrar sesión" onPress={handleSignOut} />
      </Sheet>

      <ConfirmSheet
        open={confirmDelete}
        title={DELETE_DATA_COPY.title}
        description={DELETE_DATA_COPY.description}
        confirmLabel={DELETE_DATA_COPY.confirm}
        onConfirm={handleDeleteData}
        onClose={() => setConfirmDelete(false)}
      />
    </>
  )
}

function MenuItem({ icon: Icon, label, color, onPress }: { icon: LucideIcon; label: string; color?: string; onPress: () => void }) {
  const { palette: c } = useTheme()
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 44,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 10,
        borderRadius: 6,
        backgroundColor: pressed ? c.surface.hover : 'transparent',
      })}
    >
      <Icon size={16} color={color ?? c.ink.DEFAULT} />
      <Text color={color}>{label}</Text>
    </Pressable>
  )
}

/** Barra inferior: secciones y botón central para registrar. */
export function BottomNav({ state, navigation }: BottomTabBarProps) {
  const { palette: c } = useTheme()
  const insets = useSafeAreaInsets()
  const { openNew } = useTransactionEditor()

  const tabs = state.routes.filter((route) => NAV[route.name]).map((route) => {
    const item = NAV[route.name]
    const index = state.routes.indexOf(route)
    const focused = state.index === index
    const Icon = item.icon
    return (
      <Pressable
        key={route.key}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={item.label}
        onPress={() => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true })
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params)
        }}
        style={{ flex: 1, alignItems: 'center', gap: 4, paddingVertical: 6 }}
      >
        <Icon size={20} strokeWidth={focused ? 2.25 : 1.75} color={focused ? c.accent : c.ink.muted} />
        <Text size={11} weight={focused ? 'medium' : 'regular'} tone={focused ? 'ink' : 'muted'} numberOfLines={1}>
          {item.label}
        </Text>
      </Pressable>
    )
  })

  return (
    <View style={{ backgroundColor: c.surface.DEFAULT, borderTopWidth: 1, borderTopColor: c.line.DEFAULT, paddingBottom: insets.bottom }}>
      <View style={{ height: TAB_BAR_HEIGHT, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 }}>
        {tabs.slice(0, 2)}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Pressable
            onPress={() => openNew()}
            accessibilityRole="button"
            accessibilityLabel="Nuevo movimiento"
            style={({ pressed }) => ({
              // 56 px más el anillo de 4 px del color de fondo (ring-4 en la web)
              marginTop: -28,
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: c.ink.DEFAULT,
              borderWidth: 4,
              borderColor: c.page,
              alignItems: 'center',
              justifyContent: 'center',
              elevation: 6,
              transform: [{ scale: pressed ? 0.95 : 1 }],
            })}
          >
            <Plus size={24} strokeWidth={2.25} color={c.page} />
          </Pressable>
        </View>
        {tabs.slice(2)}
      </View>
    </View>
  )
}
