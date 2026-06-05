import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

type HoyMoodHeroCardProps = {
  emotionEmoji: string;
  emotionLabel: string;
  energyLevel: number;
  coachLine: string;
  onPressFeel?: () => void;
};

export function HoyMoodHeroCard({
  emotionEmoji,
  emotionLabel,
  energyLevel,
  coachLine,
  onPressFeel,
}: HoyMoodHeroCardProps) {
  const { t } = useI18n();

  const content = (
    <>
      <Text style={styles.eyebrow}>{t('hoy.focusMoodLabel')}</Text>
      <View style={styles.moodRow}>
        <Text style={styles.emoji} accessibilityLabel={emotionLabel}>
          {emotionEmoji}
        </Text>
        <View style={styles.moodTextCol}>
          <Text style={styles.emotion}>{emotionLabel}</Text>
          <Text style={styles.energy}>{t('hoy.moodHeroEnergy', { level: energyLevel })}</Text>
        </View>
      </View>
      <Text style={styles.valueLine}>{t('hoy.moodHeroValue')}</Text>
      <Text style={styles.coach}>{coachLine}</Text>
      {onPressFeel ? (
        <Text style={styles.tapHint}>{t('hoy.moodHeroTapHint')}</Text>
      ) : null}
    </>
  );

  return (
    <LinearGradient
      colors={[THEME.colors.gradient.blue, THEME.colors.calm.lavenderDeep, THEME.colors.gradient.pink]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      {onPressFeel ? (
        <TouchableOpacity
          onPress={onPressFeel}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel={t('hoy.focusLinkFeel')}
          accessibilityHint={t('hoy.moodHeroTapHint')}
        >
          {content}
        </TouchableOpacity>
      ) : (
        content
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: THEME.borderRadius.xl,
    padding: THEME.spacing.lg,
    gap: THEME.spacing.xs,
    ...THEME.shadows.soft,
  },
  eyebrow: {
    ...THEME.typography.caption,
    color: THEME.colors.onGradientMuted,
    fontFamily: THEME.fonts.heading.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  moodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.md,
    marginTop: THEME.spacing.xs,
  },
  emoji: {
    fontSize: 48,
    lineHeight: 52,
  },
  moodTextCol: {
    flex: 1,
    gap: 2,
  },
  emotion: {
    ...THEME.typography.h2,
    fontSize: 28,
    lineHeight: 34,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.onGradient,
  },
  energy: {
    ...THEME.typography.body,
    fontSize: 16,
    color: THEME.colors.onGradientSoft,
    fontFamily: THEME.fonts.heading.medium,
  },
  valueLine: {
    ...THEME.typography.small,
    lineHeight: 20,
    color: THEME.colors.onGradientSoft,
    marginTop: THEME.spacing.sm,
  },
  coach: {
    ...THEME.typography.body,
    fontSize: 16,
    lineHeight: 24,
    color: THEME.colors.onGradientMuted,
    marginTop: THEME.spacing.xs,
  },
  tapHint: {
    ...THEME.typography.caption,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
    marginTop: THEME.spacing.sm,
    textDecorationLine: 'underline',
  },
});
