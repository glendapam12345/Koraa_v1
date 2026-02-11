import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { THEME } from '@/constants/theme';
import { CheckCircle, AlertCircle, Info } from 'lucide-react-native';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onHide?: () => void;
}

export function Toast({ message, type = 'success', duration = 3000, onHide }: ToastProps) {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Animación de entrada
    translateY.value = withSpring(0, {
      damping: 15,
      stiffness: 150,
    });
    opacity.value = withSpring(1);

    // Animación de salida después del duration
    const hideTimer = setTimeout(() => {
      translateY.value = withSpring(-100, {
        damping: 15,
        stiffness: 150,
      });
      opacity.value = withSpring(0, {}, (finished) => {
        if (finished && onHide) {
          runOnJS(onHide)();
        }
      });
    }, duration);

    return () => clearTimeout(hideTimer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} color="#FFFFFF" />;
      case 'error':
        return <AlertCircle size={20} color="#FFFFFF" />;
      case 'info':
        return <Info size={20} color="#FFFFFF" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return '#10B981';
      case 'error':
        return '#EF4444';
      case 'info':
        return THEME.colors.gradient.blue;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: getBackgroundColor() },
        animatedStyle,
      ]}
    >
      {getIcon()}
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: THEME.spacing.xl * 2,
    left: THEME.spacing.md,
    right: THEME.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    ...THEME.shadows.soft,
    zIndex: 1000,
  },
  message: {
    ...THEME.typography.body,
    color: '#FFFFFF',
    flex: 1,
    marginLeft: THEME.spacing.sm,
    fontFamily: THEME.fonts.heading.medium,
  },
});
