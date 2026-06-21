import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Plus } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { LifeArea } from '@/lib/lifeAreas/types';

type LifeAreaSwatchGridProps = {
  areas: LifeArea[];
  selectedId?: string | null;
  onSelect?: (areaId: string) => void;
  onCreatePress?: () => void;
};

export function LifeAreaSwatchGrid({
  areas,
  selectedId,
  onSelect,
  onCreatePress,
}: LifeAreaSwatchGridProps) {
  const { t } = useI18n();

  return (
    <View style={styles.grid}>
      {areas.map((area) => {
        const selected = area.id === selectedId;
        return (
          <TouchableOpacity
            key={area.id}
            style={[
              styles.swatch,
              selected && styles.swatchSelected,
              { borderColor: selected ? area.color : THEME.colors.calm.border },
            ]}
            onPress={() => onSelect?.(area.id)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={t('tasksExperience.areaSelectA11y', { name: area.name })}
          >
            <View style={[styles.dot, { backgroundColor: area.color }]} />
            <Text style={styles.emoji}>{area.emoji}</Text>
            <Text style={styles.name} numberOfLines={1}>
              {area.name}
            </Text>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        style={[styles.swatch, styles.createSwatch]}
        onPress={onCreatePress}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={t('tasksExperience.areaCreateA11y')}
      >
        <Plus size={20} color={THEME.colors.calm.lavenderDeep} />
        <Text style={styles.createLabel}>{t('tasksExperience.areaCreate')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.sm,
  },
  swatch: {
    width: '30%',
    minWidth: 96,
    flexGrow: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: 8,
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1.5,
    backgroundColor: THEME.colors.calm.card,
    ...THEME.shadows.soft,
  },
  swatchSelected: {
    backgroundColor: THEME.colors.calm.mist,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emoji: {
    fontSize: THEME.typography.displayEmojiMd.fontSize,
    lineHeight: 26,
  },
  name: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
    textAlign: 'center',
    lineHeight: 16,
  },
  createSwatch: {
    borderStyle: 'dashed',
    borderColor: THEME.colors.calm.lavenderDeep,
    backgroundColor: THEME.colors.calm.lavender,
    justifyContent: 'center',
    minHeight: 88,
  },
  createLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    textAlign: 'center',
    lineHeight: 16,
  },
});
