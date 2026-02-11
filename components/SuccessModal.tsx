import { View, Text, StyleSheet, Modal, Image } from 'react-native';
import { useEffect } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence, withTiming } from 'react-native-reanimated';
import { THEME } from '@/constants/theme';

type SuccessModalProps = {
  visible: boolean;
  message?: string;
  onClose: () => void;
};

export function SuccessModal({ visible, message = 'Guardado', onClose }: SuccessModalProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSequence(
        withSpring(1.2, { damping: 8 }),
        withSpring(1, { damping: 10 })
      );
      opacity.value = withTiming(1, { duration: 200 });

      const timer = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 200 });
        setTimeout(onClose, 200);
      }, 1500);

      return () => clearTimeout(timer);
    } else {
      scale.value = 0;
      opacity.value = 0;
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.content, animatedStyle]}>
          <View style={styles.iconContainer}>
            <Image
              source={require('@/assets/images/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.message}>{message}</Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.xl,
    alignItems: 'center',
    minWidth: 200,
    ...THEME.shadows.soft,
  },
  iconContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  logo: {
    width: 80,
    height: 80,
  },
  message: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    textAlign: 'center',
  },
});
