import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import {
  SentirVisualCheckIn,
  type SentirEmotionOption,
} from '@/components/sentir/SentirVisualCheckIn';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { HoyFlowLegend } from '@/components/hoy/HoyFlowLegend';
import { getFirstName } from '@/lib/displayName';

type HoyInicioViewProps = {
  displayName: string;
  emotions: SentirEmotionOption[];
  hasTasks: boolean;
  pendingCount?: number;
  onCheckInSaved: () => void;
  onEmotionPreviewChange?: (emotionId: string) => void;
};

export function HoyInicioView({
  displayName,
  emotions,
  hasTasks,
  pendingCount = 0,
  onCheckInSaved,
  onEmotionPreviewChange,
}: HoyInicioViewProps) {
  const { t } = useI18n();
  const firstName = getFirstName(displayName);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('hoy.greetingMorning');
    if (hour < 18) return t('hoy.greetingAfternoon');
    return t('hoy.greetingEvening');
  }, [t]);

  const openMindDump = () => router.push('/(tabs)/vaciar');

  if (!hasTasks) {
    return (
      <View style={styles.root}>
        <Text style={styles.eyebrow}>{t('hoy.inicio.eyebrow')}</Text>

        <View style={styles.header}>
          <Text style={styles.greeting}>
            {t('hoy.inicio.greetingWithName', { greeting, name: firstName })}
          </Text>
          <Text style={styles.subtitle}>{t('hoy.inicio.tasksFirstSub')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('hoy.inicio.tasksFirstTitle')}</Text>
          <Text style={styles.sectionSub}>{t('hoy.inicio.tasksFirstBody')}</Text>
        </View>

        <CalmPrimaryButton label={t('hoy.inicio.tasksFirstCta')} onPress={openMindDump} large />

        <HoyFlowLegend currentStep="tasks" />
      </View>
    );
  }

  const subtitle = t('hoy.inicio.metaWithTasks', { count: pendingCount });

  return (
    <View style={styles.root}>
      <Text style={styles.eyebrow}>{t('hoy.inicio.eyebrow')}</Text>

      <View style={styles.header}>
        <Text style={styles.greeting}>
          {t('hoy.inicio.greetingWithName', { greeting, name: firstName })}
        </Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('hoy.howFeelToday')}</Text>
        <Text style={styles.sectionSub}>{t('hoy.inicio.feelSectionSub')}</Text>
      </View>

      <SentirVisualCheckIn
        emotions={emotions}
        embedded
        showQuickBadge
        saveLabelKey="hoy.inicio.startMyDay"
        onEmotionChange={onEmotionPreviewChange}
        onSaved={onCheckInSaved}
      />

      <Text style={styles.instructionHint}>{t('hoy.inicio.instructionHint')}</Text>

      <HoyFlowLegend currentStep="feel" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: THEME.spacing.lg,
  },
  eyebrow: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  header: {
    gap: THEME.spacing.sm,
  },
  greeting: {
    ...THEME.typography.h1,
    fontSize: 28,
    color: THEME.colors.text.main,
    textAlign: 'center',
  },
  subtitle: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    gap: THEME.spacing.xs,
  },
  sectionTitle: {
    ...THEME.typography.h2,
    fontSize: 22,
    color: THEME.colors.text.main,
    textAlign: 'center',
  },
  sectionSub: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  instructionHint: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
