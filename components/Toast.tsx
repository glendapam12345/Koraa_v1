import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { THEME } from '@/constants/theme';
import { CheckCircle, AlertCircle, Info } from 'lucide-react-native';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onHide?: () => void;
}

export function Toast({ message, type = 'success', duration = 3000, onHide }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    // Animación de entrada
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-ocultar después de la duración
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -50,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onHide?.();
      });
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onHide, opacity, translateY]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} color={THEME.colors.onGradient} />;
      case 'error':
        return <AlertCircle size={20} color={THEME.colors.onGradient} />;
      case 'info':
        return <Info size={20} color={THEME.colors.onGradient} />;
      default:
        return <CheckCircle size={20} color={THEME.colors.onGradient} />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return THEME.colors.gradient.blue;
      case 'error':
        return THEME.colors.gradient.pink;
      case 'info':
        return THEME.colors.gradient.pink;
      default:
        return THEME.colors.gradient.blue;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }],
          backgroundColor: getBackgroundColor(),
        },
      ]}
    >
      <View style={styles.content}>
        {getIcon()}
        <Text style={styles.message}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: THEME.spacing.lg,
    right: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    ...THEME.shadows.soft,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  message: {
    ...THEME.typography.body,
    color: THEME.colors.onGradient,
    flex: 1,
    fontFamily: THEME.fonts.heading.medium,
  },
});
