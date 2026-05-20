import { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { markFirstSessionTourSeen } from '@/lib/firstSessionTour';
import { Crown, Edit3, Heart, Home } from 'lucide-react-native';
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
      { tabLabel: t('tabs.tasks'), title: t('tour.step1Title'), body: t('tour.step1Body'), Icon: Edit3 },
      { tabLabel: t('tabs.feel'), title: t('tour.step2Title'), body: t('tour.step2Body'), Icon: Heart },
      { tabLabel: t('tabs.today'), title: t('tour.step3Title'), body: t('tour.step3Body'), Icon: Home },
      { tabLabel: 'Premium', title: t('tour.step4Title'), body: t('tour.step4Body'), Icon: Crown },
    ],
    [t],
  );

  useEffect(() => {
    if (visible) setStepIndex(0);
  }, [visible, userId]);

  const finish = useCallback(async () => {
    await markFirstSessionTourSeen(userId);
    onFinished();
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
          <TouchableOpacity onPress={handleNext} activeOpacity={0.88} style={styles.ctaWrap}>
            <LinearGradient colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaGradient}>
              <Text style={styles.ctaText}>{isLast ? t('tour.start') : t('tour.next')}</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => void finish()} style={styles.skipWrap}>
            <Text style={styles.skipText}>{t('tour.skip')}</Text>
          </TouchableOpacity>
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
  tabPill: {
    ...THEME.typography.caption,
    color: THEME.colors.gradient.blue,
    textAlign: 'center',
    marginBottom: THEME.spacing.xs,
    fontFamily: THEME.fonts.heading.medium,
  },
  title: { ...THEME.typography.h2, color: THEME.colors.text.main, textAlign: 'center', marginBottom: THEME.spacing.sm },
  body: { ...THEME.typography.body, color: THEME.colors.text.secondary, textAlign: 'center', lineHeight: 24, marginBottom: THEME.spacing.lg },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: THEME.spacing.xs, marginBottom: THEME.spacing.lg },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: THEME.colors.stroke[100] },
  dotActive: { backgroundColor: THEME.colors.gradient.blue, width: 24 },
  ctaWrap: { borderRadius: THEME.borderRadius.rounded, overflow: 'hidden', marginBottom: THEME.spacing.sm },
  ctaGradient: { paddingVertical: THEME.spacing.md, alignItems: 'center' },
  ctaText: { ...THEME.typography.body, color: THEME.colors.onGradient, fontFamily: THEME.fonts.heading.bold },
  skipWrap: { alignItems: 'center', padding: THEME.spacing.sm },
  skipText: { ...THEME.typography.caption, color: THEME.colors.text.secondary },
});
