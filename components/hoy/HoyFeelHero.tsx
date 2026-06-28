import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

type HoyFeelHeroProps = {
  hasCheckIn: boolean;
  emotionEmoji?: string;
  emotionLabel?: string;
  energyLevel?: number;
  onUpdateFeel: () => void;
};

export function HoyFeelHero({
  hasCheckIn,
  emotionEmoji = '💜',
  emotionLabel = '',
  energyLevel = 0,
  onUpdateFeel,
}: HoyFeelHeroProps) {
  const { t } = useI18n();

  if (hasCheckIn && emotionLabel) {
    return (
      <Pressable
        onPress={onUpdateFeel}
        style={({ pressed }) => [styles.pressable, pressed && styles.pressablePressed]}
        accessibilityRole="button"
        accessibilityLabel={t('hoy.currentStateEditA11y')}
        accessibilityHint={t('hoy.feelHeroTapUpdate')}
      >
        <LinearGradient
          colors={[THEME.colors.calm.blush, THEME.colors.fill[100], THEME.colors.calm.mist]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.card, styles.cardBorder]}
        >
          <Text style={styles.eyebrow}>{t('hoy.focusMoodLabel')}</Text>
          <View style={styles.moodRow}>
            <Text style={styles.emoji} accessibilityLabel={emotionLabel}>
              {emotionEmoji}
            </Text>
            <View style={styles.moodTextCol}>
              <Text style={styles.emotion} numberOfLines={1}>
                {emotionLabel}
              </Text>
              {energyLevel > 0 ? (
                <Text style={styles.energy}>{t('hoy.moodHeroEnergy', { level: energyLevel })}</Text>
              ) : null}
            </View>
          </View>
          <Text style={styles.koraaLine}>{t('hoy.feelHeroPurposeDone')}</Text>
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onUpdateFeel}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressablePressed]}
      accessibilityRole="button"
      accessibilityLabel={t('hoy.inicio.primaryCta')}
      accessibilityHint={t('hoy.feelHeroPurpose')}
    >
      <LinearGradient
        colors={[THEME.colors.calm.blush, THEME.colors.fill[100], THEME.colors.calm.mist]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, styles.cardBorder]}
      >
        <Text style={styles.eyebrow}>{t('hoy.startHereEyebrow')}</Text>
        <Text style={styles.inviteTitle}>{t('hoy.feelHeroQuestion')}</Text>
        <Text style={styles.koraaLine}>{t('hoy.feelHeroPurposeShort')}</Text>
        <Text style={styles.linkLine}>{t('hoy.feelHeroCompactCta')} →</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
    borderRadius: THEME.borderRadius.rounded,
  },
  pressablePressed: {
    opacity: 0.92,
  },
  card: {
    borderRadius: THEME.borderRadius.rounded,
    paddingVertical: 10,
    paddingHorizontal: THEME.spacing.sm,
    gap: 4,
  },
  cardBorder: {
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  eyebrow: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.accent.italic,
    color: THEME.colors.calm.lavenderDeep,
    lineHeight: 18,
  },
  moodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    marginTop: 2,
  },
  emoji: {
    fontSize: 26,
    lineHeight: 30,
  },
  moodTextCol: {
    flex: 1,
    gap: 0,
    minWidth: 0,
  },
  emotion: {
    ...THEME.typography.body,
    lineHeight: 20,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
  },
  energy: {
    ...THEME.typography.meta,
    lineHeight: 18,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
  },
  inviteTitle: {
    ...THEME.typography.h3,
    lineHeight: 26,
    fontFamily: THEME.fonts.accent.italic,
    color: THEME.colors.text.main,
    marginTop: 2,
  },
  koraaLine: {
    ...THEME.typography.caption,
    lineHeight: 20,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
    marginTop: 2,
  },
  linkLine: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
    lineHeight: 18,
    marginTop: 4,
  },
});
