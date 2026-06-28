import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useMemo } from 'react';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { AppLocale } from '@/lib/i18n';
import { countOnboardingCaptureItems, ONBOARDING_CAPTURE_MAX_ITEMS } from '@/lib/onboardingCaptureBuild';

type OnboardingCaptureFieldProps = {
  value: string;
  onChange: (value: string) => void;
  locale: AppLocale;
  editable?: boolean;
};

export function OnboardingCaptureField({
  value,
  onChange,
  locale,
  editable = true,
}: OnboardingCaptureFieldProps) {
  const { t } = useI18n();

  const detectedCount = useMemo(
    () => countOnboardingCaptureItems(value, locale),
    [value, locale],
  );

  const cappedCount = Math.min(detectedCount, ONBOARDING_CAPTURE_MAX_ITEMS);

  return (
    <View style={styles.root}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={t('onboarding.capture.placeholder')}
        placeholderTextColor={THEME.colors.text.tertiary}
        multiline
        textAlignVertical="top"
        editable={editable}
        accessibilityLabel={t('onboarding.capture.placeholder')}
      />
      {cappedCount > 0 ? (
        <Text style={styles.detectedHint}>
          {cappedCount === 1
            ? t('onboarding.capture.detectedOne')
            : t('onboarding.capture.detectedMany', { count: cappedCount })}
          {detectedCount > ONBOARDING_CAPTURE_MAX_ITEMS
            ? ` ${t('onboarding.capture.detectedCap', { max: ONBOARDING_CAPTURE_MAX_ITEMS })}`
            : ''}
        </Text>
      ) : (
        <Text style={styles.helper}>{t('onboarding.capture.helper')}</Text>
      )}
    </View>
  );
}

export function OnboardingCaptureSkipLink({
  onPress,
  disabled,
  label,
}: {
  onPress: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={styles.skipBtn}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled), busy: Boolean(disabled) }}
    >
      <Text style={styles.skipText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: THEME.spacing.xs,
    marginTop: THEME.spacing.sm,
  },
  input: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    minHeight: 160,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    backgroundColor: THEME.colors.fill[100],
    lineHeight: 22,
    ...THEME.shadows.soft,
  },
  helper: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  detectedHint: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.calm.lavenderDeep,
    lineHeight: 18,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: THEME.spacing.sm,
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
    marginTop: THEME.spacing.xs,
  },
  skipText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
    textAlign: 'center',
  },
});
