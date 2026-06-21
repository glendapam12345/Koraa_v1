import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { THEME } from '@/constants/theme';

type AppLoadingGateProps = {
  message: string;
  errorMessage?: string;
  retryLabel?: string;
  onRetry?: () => void;
};

export function AppLoadingGate({
  message,
  errorMessage,
  retryLabel,
  onRetry,
}: AppLoadingGateProps) {
  const showError = Boolean(errorMessage);

  return (
    <View
      style={styles.container}
      accessibilityRole={showError ? 'alert' : undefined}
      accessibilityLabel={showError ? errorMessage : message}
    >
      <ActivityIndicator size="large" color={THEME.colors.gradient.blue} />
      <Text style={styles.message}>{showError ? errorMessage : message}</Text>
      {showError && onRetry && retryLabel ? (
        <TouchableOpacity
          onPress={onRetry}
          style={styles.retryBtn}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={retryLabel}
        >
          <Text style={styles.retryText}>{retryLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.colors.calm.background,
    paddingHorizontal: THEME.spacing.lg,
    gap: THEME.spacing.md,
  },
  message: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    maxWidth: 320,
  },
  retryBtn: {
    minHeight: THEME.sizes.touchTarget,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.mist,
    justifyContent: 'center',
  },
  retryText: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.gradient.blue,
  },
});
