import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { Sparkles, X } from 'lucide-react-native';
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
      onRequestClose={handleClose}
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
            <View
              style={styles.modalContent}
            >
              <LinearGradient
                colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modal}
              >
                <TouchableOpacity
                  onPress={handleClose}
                  style={styles.closeButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={20} color="#FFFFFF" />
                </TouchableOpacity>

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
                  <Text style={styles.buttonText}>Empezar</Text>
                </TouchableOpacity>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
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
  closeButton: {
    position: 'absolute',
    top: THEME.spacing.md,
    right: THEME.spacing.md,
    zIndex: 10,
    padding: THEME.spacing.xs,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
