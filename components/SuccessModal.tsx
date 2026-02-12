import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Animated } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import { THEME } from '@/constants/theme';

type SuccessModalProps = {
  visible: boolean;
  message?: string;
  onClose: () => void;
};

export function SuccessModal({ visible, message = 'Guardado', onClose }: SuccessModalProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (visible) {
      // Animación de entrada
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-cerrar después de 2 segundos
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: -20,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onClose();
        });
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      // Resetear valores cuando se oculta
      opacity.setValue(0);
      translateY.setValue(-20);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity,
              transform: [{ translateY }],
            },
          ]}
        >
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
