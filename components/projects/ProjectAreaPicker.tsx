import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Plus } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { LifeAreaKey, LifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';
import { frontThemeForKey } from '@/lib/frentes/frontTheme';
import {
  listSelectableLifeAreas,
  type UserLifeAreasConfig,
} from '@/lib/lifeAreas/userLifeAreas';
import type { TranslationKey } from '@/lib/i18n';

type ProjectAreaPickerProps = {
  value: LifeAreaRef;
  onChange: (key: LifeAreaRef) => void;
  lifeAreasConfig?: UserLifeAreasConfig;
  onAddCustomArea?: () => void;
};

export function ProjectAreaPicker({
  value,
  onChange,
  lifeAreasConfig,
  onAddCustomArea,
}: ProjectAreaPickerProps) {
  const { t } = useI18n();
  const config = lifeAreasConfig ?? { labels: {}, custom: [] };

  const areas = listSelectableLifeAreas(config, (key: LifeAreaKey) =>
    t(`lifeAreas.${key}` as TranslationKey),
  );

  return (
    <View style={styles.wrap}>
      <Text style={styles.hint}>{t('projects.areaPickerHint')}</Text>
      <View style={styles.grid}>
        {areas.map((area, index) => {
          const selected = value === area.ref;
          const themeKey = area.catalogKey ?? 'other';
          const theme = frontThemeForKey(themeKey, index);
          return (
            <TouchableOpacity
              key={area.ref}
              style={[
                styles.chip,
                { backgroundColor: theme.bg, borderColor: selected ? theme.accent : theme.border },
                selected && styles.chipSelected,
              ]}
              onPress={() => onChange(area.ref)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text style={styles.emoji}>{area.emoji}</Text>
              <Text style={[styles.label, { color: theme.accent }]} numberOfLines={2}>
                {area.name}
              </Text>
            </TouchableOpacity>
          );
        })}
        {onAddCustomArea ? (
          <TouchableOpacity
            style={[styles.chip, styles.addChip]}
            onPress={onAddCustomArea}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={t('areasCompact.newAreaA11y')}
          >
            <Plus size={18} color={THEME.colors.calm.lavenderDeep} />
            <Text style={styles.addLabel}>{t('areasCompact.newArea')}</Text>
          </TouchableOpacity>
        ) : null}
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
  addChip: {
    backgroundColor: THEME.colors.calm.mist,
    borderColor: THEME.colors.calm.border,
    borderStyle: 'dashed',
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
  addLabel: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.calm.lavenderDeep,
    flex: 1,
    lineHeight: 16,
  },
});
