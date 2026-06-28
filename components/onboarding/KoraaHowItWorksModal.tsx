import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { X, Route } from 'lucide-react-native';
import { useI18n } from '@/contexts/I18nContext';
import type { TranslationKey } from '@/lib/i18n';
import { KORAA_GUIDE_STEPS } from '@/lib/koraaGuideSteps';
import { OnboardingHighlightCard } from '@/components/onboarding/OnboardingHighlightCard';

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

          <View style={styles.iconContainer}>
            <Route size={40} color={THEME.colors.gradient.blue} />
          </View>

          <Text style={styles.title}>{t(titleKey)}</Text>
          <Text style={styles.subtitle}>{t(subtitleKey)}</Text>

          <View
            style={styles.stepsContainer}
            accessibilityRole="summary"
            accessibilityLabel={t('koraaGuide.stepsA11y')}
          >
            {KORAA_GUIDE_STEPS.map((step, index) => (
              <View key={step.titleKey} style={styles.step}>
                <Text style={styles.stepNumber}>{index + 1}</Text>
                <View style={styles.stepContent}>
                  <Text style={styles.stepLabel}>{t(step.labelKey)}</Text>
                  <Text style={styles.stepTitle}>{t(step.titleKey)}</Text>
                  <Text style={styles.stepDescription}>{t(step.bodyKey)}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.adaptCardWrap}>
            <OnboardingHighlightCard
              title={t('onboarding.howItWorks.adaptTitle')}
              body={t('onboarding.howItWorks.adaptBody')}
            />
          </View>

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
    padding: THEME.spacing.lg,
  },
  modalContent: {
    backgroundColor: THEME.colors.calm.card,
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    padding: THEME.spacing.lg,
    width: '100%',
    maxWidth: 400,
    maxHeight: '92%',
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
    marginBottom: THEME.spacing.sm,
    marginTop: THEME.spacing.xs,
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
    marginBottom: THEME.spacing.md,
    lineHeight: 22,
  },
  stepsContainer: {
    marginBottom: THEME.spacing.sm,
    gap: THEME.spacing.sm,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: THEME.colors.gradient.blue,
    color: THEME.colors.onGradient,
    textAlign: 'center',
    lineHeight: 28,
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    marginRight: THEME.spacing.sm,
  },
  stepContent: {
    flex: 1,
    gap: 2,
  },
  stepLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
  stepTitle: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  stepDescription: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  adaptCardWrap: {
    marginBottom: THEME.spacing.md,
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
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
  },
});
