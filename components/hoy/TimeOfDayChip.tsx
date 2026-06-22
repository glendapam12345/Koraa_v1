import { View, Text, StyleSheet } from 'react-native';
import { Moon, Sun, Sunset, CloudSun } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import type { TimeOfDayPeriod } from '@/lib/timeOfDayContext';

type TimeOfDayChipProps = {
  period: TimeOfDayPeriod;
  label: string;
};

function ChipIcon({ period }: { period: TimeOfDayPeriod }) {
  const size = 14;
  const color = THEME.colors.calm.lavenderDeep;
  switch (period) {
    case 'morning':
      return <Sun size={size} color={color} />;
    case 'afternoon':
      return <CloudSun size={size} color={color} />;
    case 'evening':
      return <Sunset size={size} color={color} />;
    case 'night':
      return <Moon size={size} color={color} />;
  }
}

export function TimeOfDayChip({ period, label }: TimeOfDayChipProps) {
  return (
    <View style={styles.chip} accessibilityRole="text" accessibilityLabel={label}>
      <ChipIcon period={period} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.mist,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  label: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.calm.lavenderDeep,
    lineHeight: 16,
  },
});
