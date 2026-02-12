import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface QuickOnboardingModalProps {
  visible: boolean;
  onClose: () => void;
}

export function QuickOnboardingModal({ visible, onClose }: QuickOnboardingModalProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [visible]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={() => {}} // No permitir cerrar con botón de Android/iOS
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <View style={styles.overlayTouchable}>
          <Animated.View
            style={[
              styles.container,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.modalContent}>
              <LinearGradient
                colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modal}
              >
                {/* Botón X removido - solo se cierra con Continuar */}

                <View style={styles.iconContainer}>
                  <View style={styles.iconCircle}>
                    <Sparkles size={40} color="#FFFFFF" />
                  </View>
                </View>

                <Text style={styles.title}>¡Bienvenida a Kora!</Text>
                
                <Text style={styles.message}>
                  Organiza tu día sintiendo, no estructurando.{'\n\n'}
                  <Text style={styles.highlight}>
                    • Vaciar:</Text> Agrega tus tareas{'\n'}
                  <Text style={styles.highlight}>
                    • Sentir:</Text> Di cómo te sientes{'\n'}
                  <Text style={styles.highlight}>
                    • Accionar:</Text> Ve tus prioridades automáticas
                </Text>

                <TouchableOpacity
                  onPress={handleClose}
                  style={styles.button}
                  activeOpacity={0.8}
                >
                  <Text style={styles.buttonText}>Continuar →</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouchable: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.lg,
    // No permitir cerrar tocando fuera del modal
  },
  modalContent: {
    width: '100%',
  },
  container: {
    width: '100%',
    maxWidth: 400,
  },
  modal: {
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.xl,
    ...THEME.shadows.soft,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: THEME.spacing.lg,
    marginTop: THEME.spacing.md,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...THEME.typography.h1,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: THEME.spacing.md,
    fontFamily: THEME.fonts.heading.bold,
  },
  message: {
    ...THEME.typography.body,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: THEME.spacing.xl,
    opacity: 0.95,
  },
  highlight: {
    fontFamily: THEME.fonts.heading.bold,
    color: '#FFFFFF',
  },
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  buttonText: {
    ...THEME.typography.body,
    color: '#FFFFFF',
    fontFamily: THEME.fonts.heading.bold,
    fontSize: 16,
  },
});
