import { forwardRef, useState, type ReactNode } from 'react'
import { TextInput, View, type TextInputProps } from 'react-native'
import { Eye, EyeOff } from 'lucide-react-native'
import { formatAmountInput } from '@shared/format'
import { createStyles, font, useTheme } from '@/lib/theme'
import { IconButton } from './Button'
import { Text } from './Text'

const useStyles = createStyles((c) => ({
  field: {
    height: 40,
    borderWidth: 1,
    borderColor: c.line.DEFAULT,
    backgroundColor: c.surface.raised,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontFamily: font.regular,
    fontSize: 14,
    color: c.ink.DEFAULT,
  },
  focused: { borderColor: c.accent },
}))

/** Etiqueta de campo (`.label`). */
export function Label({ children }: { children: ReactNode }) {
  return (
    <Text size={12} weight="medium" tone="secondary" style={{ marginBottom: 6 }}>
      {children}
    </Text>
  )
}

/** Campo de texto (`.field`). */
export const TextField = forwardRef<TextInput, TextInputProps>(function TextField({ style, onFocus, onBlur, ...rest }, ref) {
  const s = useStyles()
  const { palette } = useTheme()
  const [focused, setFocused] = useState(false)
  return (
    <TextInput
      ref={ref}
      placeholderTextColor={palette.ink.muted}
      selectionColor={palette.accent}
      {...rest}
      onFocus={(e) => {
        setFocused(true)
        onFocus?.(e)
      }}
      onBlur={(e) => {
        setFocused(false)
        onBlur?.(e)
      }}
      style={[s.field, focused && s.focused, style]}
    />
  )
})

/** Contraseña con botón para mostrarla. */
export const PasswordField = forwardRef<TextInput, Omit<TextInputProps, 'secureTextEntry'>>(function PasswordField(props, ref) {
  const [visible, setVisible] = useState(false)
  return (
    <View style={{ justifyContent: 'center' }}>
      <TextField
        ref={ref}
        autoCapitalize="none"
        autoCorrect={false}
        {...props}
        secureTextEntry={!visible}
        style={{ paddingRight: 40 }}
      />
      <IconButton
        icon={visible ? EyeOff : Eye}
        size={15}
        label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        onPress={() => setVisible((v) => !v)}
        style={{ position: 'absolute', right: 4 }}
      />
    </View>
  )
})

interface AmountProps extends Omit<TextInputProps, 'value' | 'onChangeText' | 'keyboardType'> {
  value: string
  onChangeText: (value: string) => void
  /** `lg`: monto protagonista del formulario de movimiento. */
  size?: 'md' | 'lg'
}

/** Monto en CLP con separador de miles mientras se escribe. */
export const AmountField = forwardRef<TextInput, AmountProps>(function AmountField(
  { value, onChangeText, size = 'md', style, ...rest },
  ref,
) {
  const large = size === 'lg'
  return (
    <View style={{ justifyContent: 'center' }}>
      <Text
        size={large ? 24 : 14}
        tone="muted"
        style={{ position: 'absolute', left: large ? 16 : 12, zIndex: 1 }}
        pointerEvents="none"
      >
        $
      </Text>
      <TextField
        ref={ref}
        keyboardType="number-pad"
        autoComplete="off"
        value={value}
        onChangeText={(text) => onChangeText(formatAmountInput(text))}
        {...rest}
        style={[
          { fontVariant: ['tabular-nums'] },
          large
            ? { height: 64, paddingLeft: 40, fontSize: 30, fontFamily: font.semibold, letterSpacing: -0.6 }
            : { paddingLeft: 24, textAlign: 'right' },
          style,
        ]}
      />
    </View>
  )
})
