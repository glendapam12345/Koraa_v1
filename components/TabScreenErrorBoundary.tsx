import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { THEME } from '@/constants/theme';
import { logger } from '@/lib/logger';
import { useI18n } from '@/contexts/I18nContext';

type Props = {
  children: ReactNode;
  screenName?: string;
};

type State = { hasError: boolean };

function TabScreenErrorFallback({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n();
  return (
    <View style={styles.fallback} accessibilityRole="alert">
      <Text style={styles.title}>{t('tabs.screenErrorTitle')}</Text>
      <Text style={styles.body}>{t('tabs.screenErrorBody')}</Text>
      <TouchableOpacity
        style={styles.retry}
        onPress={onRetry}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={t('tabs.screenErrorRetry')}
      >
        <Text style={styles.retryLabel}>{t('tabs.screenErrorRetry')}</Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * Aísla errores de render de una tab para que no tumben Todo el TabLayout
 * (p. ej. Calendario no debe romper Hoy / «¿Cómo te sientes?»).
 */
export class TabScreenErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logger.error(
      `TabScreenErrorBoundary${this.props.screenName ? ` (${this.props.screenName})` : ''}:`,
      error,
      info.componentStack,
    );
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return <TabScreenErrorFallback onRetry={this.handleRetry} />;
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: THEME.layout.screenPaddingX,
    backgroundColor: THEME.colors.calm.background,
    gap: THEME.spacing.sm,
  },
  title: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    textAlign: 'center',
  },
  body: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    marginBottom: THEME.spacing.sm,
  },
  retry: {
    minHeight: THEME.sizes.touchTarget,
    paddingHorizontal: THEME.spacing.md,
    justifyContent: 'center',
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.mist,
  },
  retryLabel: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.calm.lavenderDeep,
  },
});
