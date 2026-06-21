import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import {
  LIFE_AREA_CATALOG,
  type LifeAreaKey,
} from '@/lib/lifeAreas/lifeAreaCatalog';
import { frontThemeForKey } from '@/lib/frentes/frontTheme';

type ProjectAreaPickerProps = {
  value: LifeAreaKey;
  onChange: (key: LifeAreaKey) => void;
};

export function ProjectAreaPicker({ value, onChange }: ProjectAreaPickerProps) {
  const { t } = useI18n();

  return (
    <View style={styles.wrap}>
      <Text style={styles.hint}>{t('projects.areaPickerHint')}</Text>
      <View style={styles.grid}>
        {LIFE_AREA_CATALOG.map((area, index) => {
          const selected = value === area.key;
          const theme = frontThemeForKey(area.key, index);
          return (
            <TouchableOpacity
              key={area.key}
              style={[
                styles.chip,
                { backgroundColor: theme.bg, borderColor: selected ? theme.accent : theme.border },
                selected && styles.chipSelected,
              ]}
              onPress={() => onChange(area.key)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text style={styles.emoji}>{area.emoji}</Text>
              <Text style={[styles.label, { color: theme.accent }]} numberOfLines={2}>
                {t(`projects.areas.${area.key}`)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.xs,
  },
  hint: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    width: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    minHeight: 48,
  },
  chipSelected: {
    ...THEME.shadows.soft,
  },
  emoji: {
    fontSize: THEME.typography.displayEmojiSm.fontSize,
    lineHeight: 24,
  },
  label: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    flex: 1,
    lineHeight: 16,
  },
});
