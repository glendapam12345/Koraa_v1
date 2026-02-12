import { useEffect } from 'react';
import { View, Text, StyleSheet, Animated as RNAnimated } from 'react-native';
import { THEME } from '@/constants/theme';
import { CheckCircle, AlertCircle, Info } from 'lucide-react-native';
import Constants from 'expo-constants';

// Detectar si estamos en Expo Go
const isExpoGo = Constants.executionEnvironment === 'storeClient';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onHide?: () => void;
}

export function Toast({ message, type = 'success', duration = 3000, onHide }: ToastProps) {
  const opacity = RNAnimated.useRef(new RNAnimated.Value(0)).current;
  const translateY = RNAnimated.useRef(new RNAnimated.Value(-50)).current;

  useEffect(() => {
    // Animación de entrada
    RNAnimated.parallel([
      RNAnimated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      RNAnimated.spring(translateY, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-ocultar después de la duración
    const timer = setTimeout(() => {
      RNAnimated.parallel([
        RNAnimated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        RNAnimated.timing(translateY, {
          toValue: -50,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onHide?.();
      });
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onHide]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} color="#FFFFFF" />;
      case 'error':
        return <AlertCircle size={20} color="#FFFFFF" />;
      case 'info':
        return <Info size={20} color="#FFFFFF" />;
      default:
        return <CheckCircle size={20} color="#FFFFFF" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return THEME.colors.gradient.blue;
      case 'error':
        return '#FF6B6B';
      case 'info':
        return THEME.colors.gradient.pink;
      default:
        return THEME.colors.gradient.blue;
    }
  };

  return (
    <RNAnimated.View
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
    </RNAnimated.View>
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
    color: '#FFFFFF',
    flex: 1,
    fontFamily: THEME.fonts.heading.medium,
  },
});
