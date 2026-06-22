import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { CalmSegmentedControl } from '@/components/ui/calm/CalmSegmentedControl';
import {
  clampEstimatedMinutes,
  stepEstimatedMinutes,
} from '@/lib/taskPlanningMeta';

type DurationUnit = 'minutes' | 'hours';

type TaskDurationStepperProps = {
  minutes: number;
  onChange: (minutes: number) => void;
  /** Versión compacta para modales de edición. */
  compact?: boolean;
};

const MINUTE_PRESETS = [15, 30, 45, 60, 90] as const;
const COMPACT_PRESETS = [15, 30, 45, 60] as const;
const HOUR_PRESETS = [60, 90, 120, 180, 240] as const;
const MIN_MINUTES = 5;
const MAX_MINUTES = 8 * 60;

function parseUnitInput(raw: string, unit: DurationUnit): number | null {
  const normalized = raw.replace(',', '.').trim();
  if (!normalized) return null;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) return null;
  const total = unit === 'minutes' ? value : value * 60;
  return clampEstimatedMinutes(total);
}

export function TaskDurationStepper({ minutes, onChange, compact = false }: TaskDurationStepperProps) {
  const { t } = useI18n();
  const [unit, setUnit] = useState<DurationUnit>(() =>
    minutes >= 60 && minutes % 30 === 0 ? 'hours' : 'minutes',
  );
  const [draft, setDraft] = useState('');

  const presets = compact ? COMPACT_PRESETS : unit === 'minutes' ? MINUTE_PRESETS : HOUR_PRESETS;
  const step = compact ? 5 : unit === 'minutes' ? 5 : 30;
  const atMin = minutes <= MIN_MINUTES;
  const atMax = minutes >= MAX_MINUTES;

  const segments = useMemo(
    () => [
      {
        id: 'minutes' as const,
        label: t('vnext.taskEditDurationMinutes'),
        accessibilityLabel: t('vnext.taskEditDurationMinutesA11y'),
      },
      {
        id: 'hours' as const,
        label: t('vnext.taskEditDurationHours'),
        accessibilityLabel: t('vnext.taskEditDurationHoursA11y'),
      },
    ],
    [t],
  );

  const inputValue =
    draft ||
    (unit === 'minutes'
      ? String(minutes)
      : String(Math.round((minutes / 60) * 10) / 10).replace(/\.0$/, ''));

  const applyDelta = (direction: -1 | 1) => {
    setDraft('');
    onChange(stepEstimatedMinutes(minutes, direction * step));
  };

  const commitDraft = () => {
    const parsed = parseUnitInput(draft || inputValue, compact ? 'minutes' : unit);
    setDraft('');
    if (parsed != null) onChange(parsed);
  };

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      {!compact ? (
        <CalmSegmentedControl
          segments={segments}
          value={unit}
          onChange={(next) => {
            setDraft('');
            setUnit(next);
          }}
          variant="chip"
        />
      ) : null}

      <View style={[styles.stepperRow, compact && styles.stepperRowCompact]}>
        <Pressable
          style={({ pressed }) => [
            styles.btn,
            compact && styles.btnCompact,
            atMin && styles.btnDisabled,
            pressed && !atMin && styles.btnPressed,
          ]}
          onPress={() => applyDelta(-1)}
          disabled={atMin}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityState={{ disabled: atMin }}
          accessibilityLabel={t('vnext.taskEditDurationDecreaseA11y')}
        >
          <Minus
            size={compact ? 16 : 18}
            color={atMin ? THEME.colors.text.tertiary : THEME.colors.calm.lavenderDeep}
          />
        </Pressable>

        <View style={[styles.valueWrap, compact && styles.valueWrapCompact]}>
          <TextInput
            style={[styles.valueInput, compact && styles.valueInputCompact]}
            value={compact ? String(minutes) : inputValue}
            onChangeText={setDraft}
            onBlur={commitDraft}
            onSubmitEditing={commitDraft}
            keyboardType="number-pad"
            returnKeyType="done"
            selectTextOnFocus
            accessibilityLabel={t('vnext.taskEditDurationInputA11y')}
            accessibilityHint={t('vnext.taskEditDurationInputHint')}
          />
          <Text style={styles.valueUnit}>
            {compact || unit === 'minutes'
              ? t('vnext.taskEditDurationUnitMin')
              : t('vnext.taskEditDurationUnitHr')}
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.btn,
            compact && styles.btnCompact,
            atMax && styles.btnDisabled,
            pressed && !atMax && styles.btnPressed,
          ]}
          onPress={() => applyDelta(1)}
          disabled={atMax}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityState={{ disabled: atMax }}
          accessibilityLabel={t('vnext.taskEditDurationIncreaseA11y')}
        >
          <Plus
            size={compact ? 16 : 18}
            color={atMax ? THEME.colors.text.tertiary : THEME.colors.calm.lavenderDeep}
          />
        </Pressable>
      </View>

      {!compact ? (
        <Text style={styles.stepHint}>
          {t('vnext.taskEditDurationStepHint', { step })}
        </Text>
      ) : null}

      <View style={[styles.presetRow, compact && styles.presetRowCompact]}>
        {presets.map((preset) => {
          const selected = minutes === preset;
          const label = t('vaciar.previewDurationMinutes', { count: preset });
          return (
            <Pressable
              key={preset}
              style={({ pressed }) => [
                styles.presetChip,
                compact && styles.presetChipCompact,
                selected && styles.presetChipOn,
                pressed && styles.presetChipPressed,
              ]}
              onPress={() => {
                setDraft('');
                onChange(preset);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text style={[styles.presetText, selected && styles.presetTextOn]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.sm,
    alignSelf: 'stretch',
  },
  wrapCompact: {
    gap: THEME.spacing.xs,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    alignSelf: 'stretch',
  },
  stepperRowCompact: {
    gap: THEME.spacing.xs,
  },
  btn: {
    width: THEME.sizes.touchTarget,
    height: THEME.sizes.touchTarget,
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    backgroundColor: THEME.colors.calm.card,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  btnCompact: {
    width: 40,
    height: 40,
  },
  btnPressed: {
    backgroundColor: THEME.colors.calm.lavender,
    borderColor: THEME.colors.calm.lavenderDeep,
  },
  btnDisabled: {
    opacity: 0.45,
  },
  valueWrap: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.calm.mist,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
    minWidth: 0,
    flexDirection: 'row',
  },
  valueWrapCompact: {
    minHeight: 40,
    paddingVertical: 6,
  },
  valueInput: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    textAlign: 'center',
    minWidth: 40,
    padding: 0,
  },
  valueInputCompact: {
    ...THEME.typography.body,
    lineHeight: 22,
    minWidth: 32,
  },
  valueUnit: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
    lineHeight: 16,
  },
  stepHint: {
    ...THEME.typography.small,
    color: THEME.colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 16,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.xs,
    justifyContent: 'center',
  },
  presetRowCompact: {
    justifyContent: 'flex-start',
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: THEME.borderRadius.pill,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    backgroundColor: THEME.colors.calm.card,
    minHeight: 36,
    justifyContent: 'center',
  },
  presetChipCompact: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 32,
  },
  presetChipOn: {
    borderColor: THEME.colors.calm.lavenderDeep,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
  },
  presetChipPressed: {
    opacity: 0.9,
  },
  presetText: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
    lineHeight: 16,
    textAlign: 'center',
  },
  presetTextOn: {
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
});
