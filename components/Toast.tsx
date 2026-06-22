import { useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Pressable,
} from 'react-native';
import { THEME } from '@/constants/theme';
import { CheckCircle, AlertCircle, Info } from 'lucide-react-native';

const DISMISS_DRAG_THRESHOLD = 36;
const DISMISS_VELOCITY_THRESHOLD = 0.45;

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onHide?: () => void;
}

export function Toast({ message, type = 'success', duration = 3000, onHide }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-50)).current;
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissingRef = useRef(false);

  const dismiss = useCallback(
    (direction: 'up' | 'side' = 'up') => {
      if (dismissingRef.current) return;
      dismissingRef.current = true;

      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: direction === 'up' ? -80 : 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onHide?.();
      });
    },
    [onHide, opacity, translateY],
  );

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dy) > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy < 0) {
          translateY.setValue(gesture.dy);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (
          gesture.dy < -DISMISS_DRAG_THRESHOLD ||
          gesture.vy < -DISMISS_VELOCITY_THRESHOLD
        ) {
          dismiss('up');
          return;
        }

        Animated.spring(translateY, {
          toValue: 0,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateY, {
          toValue: 0,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }).start();
      },
    }),
  ).current;

  useEffect(() => {
    dismissingRef.current = false;
    opacity.setValue(0);
    translateY.setValue(-50);

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

    hideTimerRef.current = setTimeout(() => {
      dismiss('up');
    }, duration);

    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
  }, [dismiss, duration, message, opacity, translateY]);

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
      {...panResponder.panHandlers}
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }],
          backgroundColor: getBackgroundColor(),
        },
      ]}
    >
      <Pressable
        onPress={() => dismiss('up')}
        accessibilityRole="button"
        accessibilityLabel={message}
        style={styles.pressable}
      >
        <View style={styles.content}>
          {getIcon()}
          <Text style={styles.message}>{message}</Text>
        </View>
      </Pressable>
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
    ...THEME.shadows.soft,
    zIndex: 9999,
  },
  pressable: {
    padding: THEME.spacing.md,
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
