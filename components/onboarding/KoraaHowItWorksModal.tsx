import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { X } from 'lucide-react-native';
import { useI18n } from '@/contexts/I18nContext';
import type { TranslationKey } from '@/lib/i18n';
import { OnboardingFlowSteps } from '@/components/onboarding/OnboardingFlowSteps';
import { OnboardingEllieCoach } from '@/components/onboarding/OnboardingEllieCoach';

type KoraaHowItWorksModalProps = {
  visible: boolean;
  onClose: () => void;
  titleKey?: TranslationKey;
  subtitleKey?: TranslationKey;
  ctaKey?: TranslationKey;
};

export function KoraaHowItWorksModal({
  visible,
  onClose,
  titleKey = 'koraaGuide.title',
  subtitleKey = 'koraaGuide.subtitle',
  ctaKey = 'koraaGuide.cta',
}: KoraaHowItWorksModalProps) {
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
            accessibilityLabel={t('koraaGuide.a11yClose')}
          >
            <X size={24} color={THEME.colors.text.main} />
          </TouchableOpacity>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <OnboardingEllieCoach message={t('onboarding.ellie.howItWorks')} mood="happy" size={52} />
            <Text style={styles.title}>{t(titleKey)}</Text>
            <Text style={styles.subtitle}>{t(subtitleKey)}</Text>
            <OnboardingFlowSteps />
          </ScrollView>

          <TouchableOpacity
            style={styles.startButton}
            onPress={onClose}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t(ctaKey)}
          >
            <LinearGradient
              colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.startButtonGradient}
            >
              <Text style={styles.startButtonText}>{t(ctaKey)}</Text>
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
    padding: THEME.spacing.md,
  },
  modalContent: {
    backgroundColor: THEME.colors.calm.card,
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.md,
    paddingBottom: THEME.spacing.md,
    width: '100%',
    maxWidth: 400,
    maxHeight: '88%',
    ...THEME.shadows.soft,
  },
  closeButton: {
    position: 'absolute',
    top: THEME.spacing.sm,
    right: THEME.spacing.sm,
    padding: THEME.spacing.xs,
    zIndex: 1,
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollContent: {
    paddingBottom: THEME.spacing.sm,
    paddingTop: THEME.spacing.xs,
  },
  title: {
    ...THEME.typography.h2,
    color: THEME.colors.text.main,
    textAlign: 'center',
    marginBottom: THEME.spacing.xs,
    fontFamily: THEME.fonts.heading.bold,
  },
  subtitle: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    marginBottom: THEME.spacing.sm,
    lineHeight: 22,
  },
  startButton: {
    borderRadius: THEME.borderRadius.rounded,
    overflow: 'hidden',
    marginTop: THEME.spacing.xs,
    ...THEME.shadows.soft,
  },
  startButtonGradient: {
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
    alignItems: 'center',
  },
  startButtonText: {
    ...THEME.typography.body,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
  },
});
