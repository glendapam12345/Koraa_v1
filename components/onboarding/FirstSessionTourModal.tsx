import { useEffect, useState, useCallback } from 'react';
import { View, Text, Modal, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { markFirstSessionTourSeen } from '@/lib/firstSessionTour';
import { markFirstFlowLandingComplete } from '@/lib/firstSessionFlow';
import { useI18n } from '@/contexts/I18nContext';
import { KORAA_GUIDE_STEPS } from '@/lib/koraaGuideSteps';

type Props = {
  visible: boolean;
  userId: string;
  onFinished: () => void;
};

/** Tour corto de primera sesión: 3 pasos del flujo core (Tareas → check-in → Hoy). */
export function FirstSessionTourModal({ visible, userId, onFinished }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const [stepIndex, setStepIndex] = useState(0);
  const steps = KORAA_GUIDE_STEPS;

  useEffect(() => {
    if (visible) setStepIndex(0);
  }, [visible, userId]);

  const finish = useCallback(async () => {
    await markFirstSessionTourSeen(userId);
    await markFirstFlowLandingComplete(userId);
    onFinished();
    router.replace('/(tabs)');
  }, [userId, onFinished]);

  const handleNext = () => {
    if (stepIndex < steps.length - 1) setStepIndex((i) => i + 1);
    else void finish();
  };

  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;
  const { Icon } = step;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={() => void finish()}>
      <View style={styles.overlay} accessibilityViewIsModal>
        <View style={[styles.card, { paddingBottom: THEME.spacing.xl + Math.max(insets.bottom, THEME.spacing.sm) }]}>
          <View style={styles.iconWrap}>
            <Icon size={40} color={THEME.colors.gradient.blue} strokeWidth={2} />
          </View>
          <Text style={styles.tabPill}>{t(step.labelKey)}</Text>
          <Text style={styles.title}>{t(step.titleKey)}</Text>
          <Text style={styles.body}>{t(step.bodyKey)}</Text>
          <View style={styles.dots}>
            {steps.map((_, i) => (
              <View key={i} style={[styles.dot, i === stepIndex && styles.dotActive]} />
            ))}
          </View>
          <CalmPrimaryButton
            label={isLast ? t('tour.start') : t('tour.next')}
            onPress={handleNext}
            large
            style={styles.cta}
          />
          <CalmPrimaryButton
            label={t('tour.skip')}
            onPress={() => void finish()}
            variant="soft"
            style={styles.skipButton}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: THEME.colors.overlayLight, justifyContent: 'flex-end' },
  card: {
    backgroundColor: THEME.colors.calm.card,
    borderTopLeftRadius: THEME.borderRadius.rounded * 2,
    borderTopRightRadius: THEME.borderRadius.rounded * 2,
    borderTopWidth: 1,
    borderColor: THEME.colors.calm.border,
    padding: THEME.spacing.lg,
    paddingTop: THEME.spacing.xl,
  },
  iconWrap: { alignSelf: 'center', marginBottom: THEME.spacing.md },
  tabPill: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    textAlign: 'center',
    marginBottom: THEME.spacing.xs,
    fontFamily: THEME.fonts.heading.bold,
  },
  title: { ...THEME.typography.h2, color: THEME.colors.text.main, textAlign: 'center', marginBottom: THEME.spacing.sm },
  body: { ...THEME.typography.body, color: THEME.colors.text.secondary, textAlign: 'center', lineHeight: 24, marginBottom: THEME.spacing.lg },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: THEME.spacing.xs, marginBottom: THEME.spacing.lg },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: THEME.colors.calm.border },
  dotActive: { backgroundColor: THEME.colors.gradient.blue, width: 24 },
  cta: { marginBottom: THEME.spacing.sm },
  skipButton: { marginBottom: THEME.spacing.xs },
});
