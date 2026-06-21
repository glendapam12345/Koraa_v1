import { Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { THEME } from '@/constants/theme';
import type { WeekPlannerDay } from '@/lib/lifeAreas/types';

type WeekDateStripProps = {
  days: WeekPlannerDay[];
  selectedId: string;
  onSelect: (dayId: string) => void;
};

export function WeekDateStrip({ days, selectedId, onSelect }: WeekDateStripProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.strip}
    >
      {days.map((day) => {
        const selected = day.id === selectedId;
        return (
          <TouchableOpacity
            key={day.id}
            onPress={() => onSelect(day.id)}
            style={[styles.pill, selected && styles.pillSelected]}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityState={{ selected }}
          >
            <Text style={[styles.pillText, selected && styles.pillTextSelected]}>
              {day.shortLabel}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  strip: {
    gap: 8,
    paddingVertical: 4,
  },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.mist,
    minWidth: 72,
    alignItems: 'center',
  },
  pillSelected: {
    backgroundColor: THEME.colors.calm.lavenderDeep,
  },
  pillText: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.secondary,
    letterSpacing: 0.3,
  },
  pillTextSelected: {
    color: THEME.colors.onGradient,
  },
});
