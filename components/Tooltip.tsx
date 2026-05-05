import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { X, Info } from 'lucide-react-native';

type TooltipProps = {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
};

export function Tooltip({ visible, title, message, onClose }: TooltipProps) {
  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Cerrar ayuda"
        accessibilityHint="Cierra esta ventana de ayuda"
      >
        <View style={styles.container}>
          <LinearGradient
            colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.tooltip}
          >
            <View style={styles.header}>
              <Info size={20} color={THEME.colors.onGradient} />
              <Text style={styles.title}>{title}</Text>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Cerrar ayuda"
                accessibilityHint="Cierra esta ventana"
              >
                <X size={18} color={THEME.colors.onGradient} />
              </TouchableOpacity>
            </View>
            <Text style={styles.message}>{message}</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.button}
              accessibilityRole="button"
              accessibilityLabel="Entendido"
              accessibilityHint="Cierra esta ayuda y vuelve a la pantalla"
            >
              <Text style={styles.buttonText}>Entendido</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: THEME.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.lg,
  },
  container: {
    width: '100%',
    maxWidth: 400,
  },
  tooltip: {
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.lg,
    ...THEME.shadows.soft,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  title: {
    ...THEME.typography.h3,
    color: THEME.colors.onGradient,
    flex: 1,
    marginLeft: THEME.spacing.xs,
    marginRight: THEME.spacing.xs,
  },
  closeButton: {
    padding: 4,
  },
  message: {
    ...THEME.typography.body,
    color: THEME.colors.onGradient,
    lineHeight: 24,
    marginBottom: THEME.spacing.md,
  },
  button: {
    backgroundColor: THEME.colors.surfaceOverlay.medium,
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.sm,
    alignItems: 'center',
    marginTop: THEME.spacing.sm,
  },
  buttonText: {
    ...THEME.typography.body,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
  },
});
