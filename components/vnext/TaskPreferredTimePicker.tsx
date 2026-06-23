import { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import {
  dateToPreferredTime,
  formatPreferredTimeLabel,
  PREFERRED_TIME_PRESETS,
  preferredTimeToDate,
} from '@/lib/taskPreferredTime';

type TaskPreferredTimePickerProps = {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  compact?: boolean;
};

export function TaskPreferredTimePicker({
  value,
  onChange,
  compact = false,
}: TaskPreferredTimePickerProps) {
  const { t, locale } = useI18n();
  const [showNativePicker, setShowNativePicker] = useState(!compact && Platform.OS === 'ios');
  const [pickerDate, setPickerDate] = useState<Date>(() =>
    value?.trim() ? preferredTimeToDate(value) : preferredTimeToDate('09:00'),
  );

  const presetLabels = useMemo(
    () =>
      PREFERRED_TIME_PRESETS.map((preset) => ({
        preset,
        label: formatPreferredTimeLabel(preset, locale) ?? preset,
      })),
    [locale],
  );

  const applyTime = (hhmm: string) => {
    onChange(hhmm);
    setPickerDate(preferredTimeToDate(hhmm));
  };

  const handleNativeChange = (event: DateTimePickerEvent, date?: Date) => {
    if (event.type === 'dismissed') {
      if (Platform.OS === 'android') setShowNativePicker(false);
      return;
    }
    if (!date) return;
    setPickerDate(date);
    if (Platform.OS === 'android') {
      onChange(dateToPreferredTime(date));
      setShowNativePicker(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.hint}>{t('vaciar.preferredTimeHint')}</Text>

      <View style={styles.presetRow}>
        {presetLabels.map(({ preset, label }) => {
          const active = value === preset;
          return (
            <TouchableOpacity
              key={preset}
              style={[styles.presetChip, active && styles.presetChipActive]}
              onPress={() => applyTime(preset)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.presetChipText, active && styles.presetChipTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {showNativePicker ? (
        <View style={styles.nativeWrap}>
          <DateTimePicker
            value={pickerDate}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleNativeChange}
            themeVariant="light"
          />
          {Platform.OS === 'ios' ? (
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={() => onChange(dateToPreferredTime(pickerDate))}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Text style={styles.confirmBtnText}>{t('vaciar.preferredTimeConfirm')}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        <TouchableOpacity
          style={styles.calendarCta}
          onPress={() => setShowNativePicker(true)}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <Text style={styles.calendarCtaText}>{t('vaciar.preferredTimePickOther')}</Text>
        </TouchableOpacity>
      )}

      {value?.trim() ? (
        <TouchableOpacity
          style={styles.clearBtn}
          onPress={() => onChange(null)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t('vaciar.preferredTimeClearA11y')}
        >
          <Text style={styles.clearBtnText}>{t('vaciar.preferredTimeClear')}</Text>
        </TouchableOpacity>
      ) : null}
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
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.xs,
  },
  presetChip: {
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.pill,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    backgroundColor: THEME.colors.calm.card,
    minHeight: 36,
    justifyContent: 'center',
  },
  presetChipActive: {
    borderColor: THEME.colors.calm.lavenderDeep,
    backgroundColor: THEME.colors.calm.lavender,
  },
  presetChipText: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
  },
  presetChipTextActive: {
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
  nativeWrap: {
    marginTop: THEME.spacing.xs,
  },
  confirmBtn: {
    marginTop: THEME.spacing.sm,
    minHeight: THEME.sizes.touchTarget,
    borderRadius: THEME.borderRadius.rounded,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.calm.lavenderDeep,
  },
  confirmBtnText: {
    ...THEME.typography.body,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
  },
  calendarCta: {
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
    alignItems: 'center',
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
  },
  calendarCtaText: {
    ...THEME.typography.small,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  clearBtn: {
    alignSelf: 'flex-start',
    paddingVertical: THEME.spacing.xs,
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
  },
  clearBtnText: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
  },
});
