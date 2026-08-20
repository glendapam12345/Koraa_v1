import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { goToCheckIn } from '@/lib/checkInNavigation';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { getEmotionEmoji } from '@/lib/emotionalInsights';
import { CalmCard } from '@/components/ui/calm/CalmCard';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';

type SentirTodayCheckInCardProps = {
  emotion: string;
  emotionLabel: string;
  energyLevel: number;
  onAdjustCheckIn: () => void;
};

export function SentirTodayCheckInCard({
  emotion,
  emotionLabel,
  energyLevel,
  onAdjustCheckIn,
}: SentirTodayCheckInCardProps) {
  const { t } = useI18n();

  return (
    <CalmCard style={styles.card}>
      <View style={styles.statusRow}>
        <Text style={styles.emoji}>{getEmotionEmoji(emotion)}</Text>
        <Text style={styles.statusLine}>
          {t('hoy.feelingLine', { emotion: emotionLabel, energy: energyLevel })}
        </Text>
      </View>
      <Text style={styles.body}>{t('sentirToday.checkedInBody')}</Text>

      <CalmPrimaryButton
        label={t('sentirToday.quickRecheck')}
        onPress={onAdjustCheckIn}
        variant="soft"
      />

      <TouchableOpacity
        onPress={() => goToCheckIn()}
        activeOpacity={0.75}
        accessibilityRole="link"
        accessibilityLabel={t('sentirToday.viewFocusInHoyA11y')}
        style={styles.hoyLinkWrap}
      >
        <Text style={styles.link}>{t('sentirToday.viewFocusInHoy')}</Text>
      </TouchableOpacity>
    </CalmCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: THEME.spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  emoji: {
    fontSize: THEME.typography.displayEmoji.fontSize,
  },
  statusLine: {
    ...THEME.typography.body,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
    flex: 1,
  },
  body: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
  },
  hoyLinkWrap: {
    alignSelf: 'center',
    marginTop: THEME.spacing.xs,
  },
  link: {
    ...THEME.typography.body,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
});
