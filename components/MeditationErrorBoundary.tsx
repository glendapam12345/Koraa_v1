import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { logger } from '@/lib/logger';

type Props = {
  children: ReactNode;
  onError: () => void;
  fallback?: ReactNode;
};

type State = { hasError: boolean };

/**
 * Error boundary para el modal de meditación.
 * Si MeditationCircle (Reanimated/SVG) lanza en algún dispositivo, evitamos que la app se cierre.
 */
export class MeditationErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logger.error('MeditationErrorBoundary:', error, info.componentStack);
    this.props.onError();
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <View style={styles.fallback}>
          <Text style={styles.text}>No se pudo abrir la meditación</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  text: {
    ...THEME.typography.body,
    color: THEME.colors.fill[100],
  },
});
