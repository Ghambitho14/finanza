import { Pressable } from 'react-native'
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker'
import { CalendarDays } from 'lucide-react-native'
import { formatShortDate, parseISODate, toISODate } from '@shared/format'
import { useTheme } from '@/lib/theme'
import { Text } from './Text'

interface Props {
  /** YYYY-MM-DD */
  value: string
  onChange: (value: string) => void
}

/** Botón con la fecha elegida que abre el calendario nativo de Android. */
export function DateField({ value, onChange }: Props) {
  const { palette: c } = useTheme()

  const open = () => {
    DateTimePickerAndroid.open({
      value: parseISODate(value),
      mode: 'date',
      onChange: (event, date) => {
        if (event.type === 'set' && date) onChange(toISODate(date))
      },
    })
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Elegir otra fecha"
      onPress={open}
      style={({ pressed }) => ({
        height: 32,
        paddingHorizontal: 12,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: pressed ? c.ink.muted : c.line.DEFAULT,
        backgroundColor: c.surface.DEFAULT,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
      })}
    >
      <CalendarDays size={14} color={c.ink.secondary} />
      <Text size={13} tone="secondary">{formatShortDate(value)}</Text>
    </Pressable>
  )
}
