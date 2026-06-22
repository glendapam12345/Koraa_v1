import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowRightLeft, Plus } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { BrainDumpAreaColumn } from '@/lib/review/buildBrainDumpAreaBoardModel';
import { LOOSE_LIFE_AREA_ID } from '@/lib/lifeAreas/projectToLifeArea';
import type { LifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';

type BrainDumpMoveAreaPickerProps = {
  columns: BrainDumpAreaColumn[];
  currentAreaRef: LifeAreaRef | null;
  onMove: (targetColumnId: string) => void;
  onAddArea?: () => void;
  looseLabel?: string;
};

export function BrainDumpMoveAreaPicker({
  columns,
  currentAreaRef,
  onMove,
  onAddArea,
  looseLabel,
}: BrainDumpMoveAreaPickerProps) {
  const { t } = useI18n();

  const areaOptions = columns.filter((column) => !column.isLoose && column.ref);
  const looseColumn = columns.find((column) => column.isLoose);
  const isOnLoose = currentAreaRef == null;

  if (areaOptions.length === 0 && !onAddArea && !looseColumn) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <ArrowRightLeft size={16} color={THEME.colors.calm.lavenderDeep} />
        <Text style={styles.title}>{t('vaciar.areaReviewMoveArea')}</Text>
      </View>
      <Text style={styles.hint}>{t('vaciar.areaReviewMoveAreaHint')}</Text>
      <View style={styles.options}>
        {looseColumn ? (
          <TouchableOpacity
            style={[styles.option, isOnLoose && styles.optionActive]}
            onPress={() => onMove(LOOSE_LIFE_AREA_ID)}
            disabled={isOnLoose}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityState={{ selected: isOnLoose, disabled: isOnLoose }}
          >
            <Text style={styles.emoji}>{looseColumn.emoji}</Text>
            <Text style={[styles.label, isOnLoose && styles.labelActive]}>
              {looseLabel ?? looseColumn.name}
            </Text>
          </TouchableOpacity>
        ) : null}
        {areaOptions.map((column) => {
          const active = column.ref === currentAreaRef;
          return (
            <TouchableOpacity
              key={column.id}
              style={[
                styles.option,
                active && styles.optionActive,
                { borderColor: active ? column.color : THEME.colors.calm.border },
              ]}
              onPress={() => onMove(column.id)}
              disabled={active}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityState={{ selected: active, disabled: active }}
            >
              <View style={[styles.colorDot, { backgroundColor: column.color }]} />
              <Text style={styles.emoji}>{column.emoji}</Text>
              <Text style={[styles.label, active && styles.labelActive]}>
                {column.name}
              </Text>
            </TouchableOpacity>
          );
        })}
        {onAddArea ? (
          <TouchableOpacity
            style={styles.addOption}
            onPress={onAddArea}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={t('vaciar.areaReviewAddAreaA11y')}
          >
            <Plus size={16} color={THEME.colors.calm.lavenderDeep} />
            <Text style={styles.addLabel}>{t('vaciar.areaReviewAddArea')}</Text>
          </TouchableOpacity>
        ) : null}
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
    alignItems: 'flex-start',
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
  addOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: THEME.borderRadius.standard,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: THEME.colors.calm.lavenderDeep,
    minHeight: THEME.sizes.touchTarget,
  },
  addLabel: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.calm.lavenderDeep,
  },
  emoji: {
    fontSize: 18,
    lineHeight: 22,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  label: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
    flex: 1,
    flexShrink: 1,
    lineHeight: 22,
    minWidth: 0,
  },
  labelActive: {
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
  },
});
