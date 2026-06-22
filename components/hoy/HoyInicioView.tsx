import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { formatGreetingWithName, formatNightReturnGreeting, useKoraaGreeting } from '@/hooks/useKoraaGreeting';
import { TimeOfDayChip } from '@/components/hoy/TimeOfDayChip';
import {
  SentirVisualCheckIn,
  type SentirEmotionOption,
} from '@/components/sentir/SentirVisualCheckIn';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { getFirstName } from '@/lib/displayName';

type HoyInicioViewProps = {
  displayName: string;
  emotions: SentirEmotionOption[];
  hasTasks: boolean;
  pendingCount?: number;
  onCheckInSaved: () => void;
  onEmotionPreviewChange?: (emotionId: string) => void;
  /** Primer día en Hoy: copy más breve y alineado con vista lite. */
  liteMode?: boolean;
};

export function HoyInicioView({
  displayName,
  emotions,
  hasTasks,
  pendingCount = 0,
  onCheckInSaved,
  onEmotionPreviewChange,
  liteMode = false,
}: HoyInicioViewProps) {
  const { t } = useI18n();
  const { period, greeting, timeChipLabel, lateNight } = useKoraaGreeting();
  const firstName = getFirstName(displayName);

  const greetingLine = lateNight
    ? formatNightReturnGreeting(t, firstName, period)
    : formatGreetingWithName(t, greeting, firstName);

  const openMindDump = () => router.push('/(tabs)/vaciar');

  if (!hasTasks) {
    return (
      <View style={styles.root}>
        <View style={styles.header}>
          <TimeOfDayChip period={period} label={timeChipLabel} />
          <Text style={styles.greeting}>{greetingLine}</Text>
          <Text style={styles.subtitle}>
            {lateNight
              ? t('hoy.nightReturnSubline', { name: firstName })
              : liteMode
                ? t('hoy.inicio.liteTasksFirstSub')
                : t('hoy.inicio.tasksFirstSub')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitleCompact}>{t('hoy.inicio.tasksFirstTitle')}</Text>
          <Text style={styles.sectionSub}>{t('hoy.inicio.tasksFirstBody')}</Text>
        </View>

        <CalmPrimaryButton label={t('hoy.inicio.tasksFirstCta')} onPress={openMindDump} large />
      </View>
    );
  }

  const subtitle = liteMode
    ? t('hoy.inicio.liteMetaWithTasks', { count: pendingCount })
    : t('hoy.inicio.metaWithTasks', { count: pendingCount });

  return (
    <View style={styles.root}>
        <View style={styles.header}>
          <TimeOfDayChip period={period} label={timeChipLabel} />
          <Text style={styles.greeting}>{greetingLine}</Text>
          <Text style={styles.subtitle}>
            {lateNight ? t('hoy.nightReturnSubline', { name: firstName }) : subtitle}
          </Text>
        </View>

      <SentirVisualCheckIn
        emotions={emotions}
        embedded
        compactEmbedded
        saveLabelKey="hoy.inicio.startMyDay"
        onEmotionChange={onEmotionPreviewChange}
        onSaved={onCheckInSaved}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: THEME.layout.sectionGapCompact,
  },
  header: {
    gap: 4,
    alignSelf: 'stretch',
  },
  greeting: {
    ...THEME.typography.titleCompact,
    lineHeight: 28,
    color: THEME.colors.text.main,
    textAlign: 'left',
  },
  subtitle: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    textAlign: 'left',
    lineHeight: 20,
  },
  section: {
    gap: THEME.spacing.xs,
  },
  sectionTitleCompact: {
    ...THEME.typography.sectionTitle,
    color: THEME.colors.text.main,
    textAlign: 'left',
  },
  sectionSub: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    textAlign: 'left',
    lineHeight: 20,
  },
});
