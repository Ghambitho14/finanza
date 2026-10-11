import { useState } from 'react'
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native'
import { Check, ChevronDown } from 'lucide-react-native'
import { useTheme } from '@/lib/theme'
import { Sheet } from './Sheet'
import { Text } from './Text'

export interface SelectOption<T extends string> {
  value: T
  label: string
}

interface Props<T extends string> {
  /** Título de la hoja con las opciones. */
  title: string
  value: T
  options: readonly SelectOption<T>[]
  onChange: (value: T) => void
  style?: StyleProp<ViewStyle>
  accessibilityLabel?: string
}

/** Reemplazo del `<select>` de la web: campo que abre una hoja con la lista. */
export function SelectField<T extends string>({ title, value, options, onChange, style, accessibilityLabel }: Props<T>) {
  const { palette: c } = useTheme()
  const [open, setOpen] = useState(false)
  const selected = options.find((o) => o.value === value)

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          {
            height: 40,
            borderWidth: 1,
            borderColor: pressed ? c.ink.muted : c.line.DEFAULT,
            backgroundColor: c.surface.raised,
            borderRadius: 8,
            paddingHorizontal: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          },
          style,
        ]}
      >
        <Text style={{ flex: 1 }} numberOfLines={1}>{selected?.label ?? ''}</Text>
        <ChevronDown size={16} color={c.ink.muted} />
      </Pressable>

      <Sheet open={open} title={title} onClose={() => setOpen(false)}>
        <View style={{ gap: 2 }}>
          {options.map((o) => {
            const active = o.value === value
            return (
              <Pressable
                key={o.value}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => {
                  onChange(o.value)
                  setOpen(false)
                }}
                style={({ pressed }) => ({
                  minHeight: 44,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  backgroundColor: pressed || active ? c.surface.hover : 'transparent',
                })}
              >
                <Text weight={active ? 'medium' : 'regular'} style={{ flex: 1 }}>{o.label}</Text>
                {active && <Check size={16} color={c.accent} />}
              </Pressable>
            )
          })}
        </View>
      </Sheet>
    </>
  )
}
