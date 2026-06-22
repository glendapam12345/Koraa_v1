import { Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { LooseTaskSortFilter } from '@/lib/looseTasks';

const FILTERS: LooseTaskSortFilter[] = ['all', 'recent', 'oldest', 'forgotten'];

type LooseTasksFilterBarProps = {
  value: LooseTaskSortFilter;
  onChange: (filter: LooseTaskSortFilter) => void;
};

export function LooseTasksFilterBar({ value, onChange }: LooseTasksFilterBarProps) {
  const { t } = useI18n();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      accessibilityRole="tablist"
    >
      {FILTERS.map((filter) => {
        const active = value === filter;
        return (
          <TouchableOpacity
            key={filter}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onChange(filter)}
            activeOpacity={0.85}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={t(`looseTasks.filter.${filter}`)}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {t(`looseTasks.filter.${filter}`)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: THEME.spacing.xs,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: THEME.borderRadius.pill,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    backgroundColor: THEME.colors.fill[100],
    minHeight: 36,
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: THEME.colors.calm.lavenderDeep,
    borderColor: THEME.colors.calm.lavenderDeep,
  },
  chipText: {
    ...THEME.typography.small,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.secondary,
  },
  chipTextActive: {
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
  },
});
