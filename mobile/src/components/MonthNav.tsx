import { View } from 'react-native'
import { ChevronLeft, ChevronRight } from 'lucide-react-native'
import { currentMonth, nextMonth, prevMonth } from '@shared/calculations'
import { formatMonthLabel } from '@shared/format'
import { useTheme } from '@/lib/theme'
import { Button, IconButton } from '@/ui/Button'
import { Text } from '@/ui/Text'

interface Props {
  month: string
  onChange: (month: string) => void
}

export function MonthNav({ month, onChange }: Props) {
  const { palette: c } = useTheme()
  const today = currentMonth()

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderRadius: 8,
          borderWidth: 1,
          borderColor: c.line.DEFAULT,
          backgroundColor: c.surface.DEFAULT,
          padding: 2,
        }}
      >
        <IconButton icon={ChevronLeft} size={18} label="Mes anterior" onPress={() => onChange(prevMonth(month))} />
        <Text weight="semibold" align="center" style={{ minWidth: 136 }} accessibilityLiveRegion="polite">
          {formatMonthLabel(month)}
        </Text>
        <IconButton icon={ChevronRight} size={18} label="Mes siguiente" onPress={() => onChange(nextMonth(month))} />
      </View>
      {month !== today && (
        <Button variant="ghost" small onPress={() => onChange(today)}>Ir al mes actual</Button>
      )}
    </View>
  )
}
