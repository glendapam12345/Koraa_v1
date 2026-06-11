import { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, Modal, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { markFirstSessionTourSeen } from '@/lib/firstSessionTour';
import { markFirstFlowLandingComplete } from '@/lib/firstSessionFlow';
import { Home, ListTodo, Calendar, Sparkles, User } from 'lucide-react-native';
import { useI18n } from '@/contexts/I18nContext';

type Props = {
  visible: boolean;
  userId: string;
  onFinished: () => void;
};

export function FirstSessionTourModal({ visible, userId, onFinished }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const [stepIndex, setStepIndex] = useState(0);

  const steps = useMemo(
    () => [
      { tabLabel: t('tabs.today'), title: t('tour.step1Title'), body: t('tour.step1Body'), Icon: Home },
      { tabLabel: t('tabs.tasks'), title: t('tour.step2Title'), body: t('tour.step2Body'), Icon: ListTodo },
      { tabLabel: t('tabs.week'), title: t('tour.step3Title'), body: t('tour.step3Body'), Icon: Calendar },
      { tabLabel: t('tabs.paraMi'), title: t('tour.step4Title'), body: t('tour.step4Body'), Icon: Sparkles },
      { tabLabel: t('tabs.profile'), title: t('tour.step5Title'), body: t('tour.step5Body'), Icon: User },
    ],
    [t],
  );

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
          <Text style={styles.tabPill}>{step.tabLabel}</Text>
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.body}>{step.body}</Text>
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
    backgroundColor: THEME.colors.fill[100],
    borderTopLeftRadius: THEME.borderRadius.rounded * 2,
    borderTopRightRadius: THEME.borderRadius.rounded * 2,
    padding: THEME.spacing.lg,
    paddingTop: THEME.spacing.xl,
  },
  iconWrap: { alignSelf: 'center', marginBottom: THEME.spacing.md },
  stepLabel: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    marginBottom: THEME.spacing.xs,
  },
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
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: THEME.colors.stroke[100] },
  dotActive: { backgroundColor: THEME.colors.gradient.blue, width: 24 },
  cta: { marginBottom: THEME.spacing.sm },
  skipButton: { marginBottom: THEME.spacing.xs },
});
