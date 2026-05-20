import React, { useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
  Platform,
} from 'react-native';
import { THEME } from '@/constants/theme';
import { OTP_CODE_LENGTH } from '@/constants/authOtp';
import { useI18n } from '@/contexts/I18nContext';

export type OTPInputProps = {
  value: string[];
  onChange: (otp: string[]) => void;
  length?: number;
  autoFocus?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
};

export function OTPInput({
  value,
  onChange,
  length = OTP_CODE_LENGTH,
  autoFocus = true,
  disabled = false,
  accessibilityLabel,
}: OTPInputProps) {
  const { t } = useI18n();
  const groupLabel = accessibilityLabel ?? t('authA11y.otpLabel');
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleChange = (text: string, index: number) => {
    const digits = text.replace(/[^0-9]/g, '');

    if (digits.length > 1) {
      const chars = digits.slice(0, length).split('');
      const newOtp = Array.from({ length }, (_, i) => chars[i] ?? '');
      onChange(newOtp);
      const lastIdx = Math.min(chars.length, length) - 1;
      const focusAt = lastIdx >= 0 ? lastIdx : 0;
      requestAnimationFrame(() => {
        inputRefs.current[focusAt]?.focus();
      });
      return;
    }

    const digit = digits.slice(-1);
    const newOtp = [...value];
    newOtp[index] = digit;
    onChange(newOtp);

    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <View
      style={styles.container}
      accessibilityRole="none"
      accessibilityLabel={groupLabel}
    >
      {Array.from({ length }).map((_, index) => (
        <TextInput
          key={index}
          ref={(ref) => {
            inputRefs.current[index] = ref;
          }}
          style={[
            styles.input,
            value[index] ? styles.inputFilled : null,
            disabled ? styles.inputDisabled : null,
          ]}
          value={value[index]}
          onChangeText={(text) => handleChange(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          keyboardType="number-pad"
          maxLength={Platform.OS === 'web' ? length : 1}
          editable={!disabled}
          selectTextOnFocus
          autoComplete={
            Platform.OS === 'web' ? 'one-time-code' : Platform.OS === 'android' ? 'sms-otp' : 'off'
          }
          textContentType="oneTimeCode"
          accessibilityLabel={t('authA11y.otpDigit', { index: index + 1, total: length })}
          accessibilityHint={t('authA11y.otpDigitHint')}
          accessibilityState={{ disabled }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: THEME.spacing.xs,
  },
  input: {
    width: 40,
    height: 52,
    borderWidth: 2,
    borderColor: THEME.colors.stroke[100],
    borderRadius: THEME.borderRadius.rounded,
    fontSize: 20,
    fontFamily: THEME.fonts.heading.bold,
    textAlign: 'center',
    backgroundColor: THEME.colors.fill[100],
    color: THEME.colors.text.main,
  },
  inputFilled: {
    borderColor: THEME.colors.gradient.blue,
    backgroundColor: THEME.colors.tint.blue.veryLight,
  },
  inputDisabled: {
    backgroundColor: THEME.colors.fill[200],
    borderColor: THEME.colors.stroke[100],
    opacity: 0.85,
  },
});
