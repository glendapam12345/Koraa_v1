import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { X, Info } from 'lucide-react-native';
import { useI18n } from '@/contexts/I18nContext';

type TooltipProps = {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
};

export function Tooltip({ visible, title, message, onClose }: TooltipProps) {
  const { t } = useI18n();
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
        accessibilityLabel={t('tooltip.close')}
        accessibilityHint={t('tooltip.closeHint')}
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
                accessibilityLabel={t('tooltip.close')}
                accessibilityHint={t('tooltip.closeShort')}
              >
                <X size={18} color={THEME.colors.onGradient} />
              </TouchableOpacity>
            </View>
            <Text style={styles.message}>{message}</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.button}
              accessibilityRole="button"
              accessibilityLabel={t('tooltip.understood')}
              accessibilityHint={t('tooltip.understoodHint')}
            >
              <Text style={styles.buttonText}>{t('tooltip.understood')}</Text>
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
