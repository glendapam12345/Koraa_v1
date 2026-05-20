import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { X, Sparkles } from 'lucide-react-native';
import { useI18n } from '@/contexts/I18nContext';

interface QuickOnboardingModalProps {
  visible: boolean;
  onClose: () => void;
}

export function QuickOnboardingModal({ visible, onClose }: QuickOnboardingModalProps) {
  const { t } = useI18n();
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('quickOnboarding.a11yClose')}
          >
            <X size={24} color={THEME.colors.text.main} />
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <Sparkles size={48} color={THEME.colors.gradient.blue} />
          </View>

          <Text style={styles.title}>{t('quickOnboarding.title')}</Text>
          <Text style={styles.subtitle}>{t('quickOnboarding.subtitle')}</Text>

          <View style={styles.stepsContainer}>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>1</Text>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{t('quickOnboarding.step1Title')}</Text>
                <Text style={styles.stepDescription}>{t('quickOnboarding.step1Body')}</Text>
              </View>
            </View>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>2</Text>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{t('quickOnboarding.step2Title')}</Text>
                <Text style={styles.stepDescription}>{t('quickOnboarding.step2Body')}</Text>
              </View>
            </View>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>3</Text>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{t('quickOnboarding.step3Title')}</Text>
                <Text style={styles.stepDescription}>{t('quickOnboarding.step3Body')}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.startButton} onPress={onClose} activeOpacity={0.8} accessibilityRole="button">
            <LinearGradient
              colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.startButtonGradient}
            >
              <Text style={styles.startButtonText}>{t('quickOnboarding.cta')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: THEME.colors.overlayStrong,
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.lg,
  },
  modalContent: {
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.xl,
    width: '100%',
    maxWidth: 400,
    ...THEME.shadows.soft,
  },
  closeButton: {
    position: 'absolute',
    top: THEME.spacing.md,
    right: THEME.spacing.md,
    padding: THEME.spacing.xs,
    zIndex: 1,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  title: {
    ...THEME.typography.h1,
    color: THEME.colors.text.main,
    textAlign: 'center',
    marginBottom: THEME.spacing.sm,
    fontFamily: THEME.fonts.heading.bold,
  },
  subtitle: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    marginBottom: THEME.spacing.lg,
    lineHeight: 22,
  },
  stepsContainer: {
    marginBottom: THEME.spacing.lg,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: THEME.spacing.md,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.gradient.blue,
    color: THEME.colors.fill[100],
    textAlign: 'center',
    lineHeight: 32,
    fontFamily: THEME.fonts.heading.bold,
    fontSize: 16,
    marginRight: THEME.spacing.sm,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    marginBottom: 4,
  },
  stepDescription: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  startButton: {
    borderRadius: THEME.borderRadius.rounded,
    overflow: 'hidden',
    ...THEME.shadows.soft,
  },
  startButtonGradient: {
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
    alignItems: 'center',
  },
  startButtonText: {
    ...THEME.typography.body,
    color: THEME.colors.fill[100],
    fontFamily: THEME.fonts.heading.bold,
    fontSize: 16,
  },
});
