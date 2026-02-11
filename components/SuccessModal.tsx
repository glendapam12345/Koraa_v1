import { View, Text, StyleSheet, Modal } from 'react-native';
import { useEffect, useCallback } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS } from 'react-native-reanimated';
import { CheckCircle2 } from 'lucide-react-native';
import { THEME } from '@/constants/theme';

type SuccessModalProps = {
  visible: boolean;
  message?: string;
  onClose: () => void;
};

export function SuccessModal({ visible, message = 'Guardado', onClose }: SuccessModalProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-20);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
      translateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) });

      const timer = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 200 }, () => {
          runOnJS(handleClose)();
        });
        translateY.value = withTiming(-20, { duration: 200 });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [visible, handleClose, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.content, animatedStyle]}>
          <CheckCircle2
            size={24}
            color="#10B981"
            strokeWidth={2}
          />
          <Text style={styles.message}>{message}</Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 60,
  },
  content: {
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.standard,
    padding: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    ...THEME.shadows.soft,
  },
  message: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontWeight: '500',
  },
});
