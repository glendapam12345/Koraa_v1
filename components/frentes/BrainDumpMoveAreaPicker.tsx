import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowRightLeft } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { BrainDumpAreaColumn } from '@/lib/review/buildBrainDumpAreaBoardModel';
import type { LifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';

type BrainDumpMoveAreaPickerProps = {
  columns: BrainDumpAreaColumn[];
  currentAreaRef: LifeAreaRef | null;
  onMove: (targetColumnId: string) => void;
};

export function BrainDumpMoveAreaPicker({
  columns,
  currentAreaRef,
  onMove,
}: BrainDumpMoveAreaPickerProps) {
  const { t } = useI18n();

  const areaOptions = columns.filter((column) => !column.isLoose && column.ref);

  if (areaOptions.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <ArrowRightLeft size={16} color={THEME.colors.calm.lavenderDeep} />
        <Text style={styles.title}>{t('vaciar.areaReviewMoveArea')}</Text>
      </View>
      <Text style={styles.hint}>{t('vaciar.areaReviewMoveAreaHint')}</Text>
      <View style={styles.options}>
        {areaOptions.map((column) => {
          const active = column.ref === currentAreaRef;
          return (
            <TouchableOpacity
              key={column.id}
              style={[styles.option, active && styles.optionActive]}
              onPress={() => onMove(column.id)}
              disabled={active}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityState={{ selected: active, disabled: active }}
            >
              <Text style={styles.emoji}>{column.emoji}</Text>
              <Text style={[styles.label, active && styles.labelActive]} numberOfLines={2}>
                {column.name}
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
    paddingTop: THEME.spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: THEME.colors.calm.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  hint: {
    ...THEME.typography.small,
    color: THEME.colors.text.tertiary,
    lineHeight: 16,
  },
  options: {
    gap: THEME.spacing.xs,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: THEME.borderRadius.standard,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    backgroundColor: THEME.colors.fill[100],
    minHeight: THEME.sizes.touchTarget,
  },
  optionActive: {
    borderColor: THEME.colors.calm.lavenderDeep,
    backgroundColor: THEME.colors.calm.lavender,
    opacity: 0.85,
  },
  emoji: {
    fontSize: 18,
    lineHeight: 22,
  },
  label: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
    flex: 1,
  },
  labelActive: {
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
  },
});
