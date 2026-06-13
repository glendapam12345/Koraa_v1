import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

type HoyMoodHeroCardProps = {
  emotionEmoji: string;
  emotionLabel: string;
  energyLevel: number;
  focusCount: number;
  restCount: number;
  firstFocusTaskName?: string;
  coachLine: string;
  allFocusDone: boolean;
  /** Día 1 lite: menos texto en el hero. */
  compact?: boolean;
  /** Abre recheck-in sin botón duplicado en Hoy. */
  onPress?: () => void;
};

export function HoyMoodHeroCard({
  emotionEmoji,
  emotionLabel,
  energyLevel,
  focusCount,
  restCount,
  firstFocusTaskName,
  coachLine,
  allFocusDone,
  compact = false,
  onPress,
}: HoyMoodHeroCardProps) {
  const { t } = useI18n();

  const koraaLine = compact
    ? focusCount > 0
      ? t('hoy.moodHeroLiteWithSteps', { count: focusCount })
      : t('hoy.moodHeroLiteNoSteps')
    : focusCount > 0
      ? restCount > 0
        ? t('hoy.moodHeroKoraaDid', {
            level: energyLevel,
            count: focusCount,
            rest: restCount,
          })
        : t('hoy.moodHeroKoraaDidNoRest', { level: energyLevel, count: focusCount })
      : t('hoy.moodHeroKoraaDidNoFocus', { level: energyLevel });

  const taskHint =
    firstFocusTaskName && !allFocusDone
      ? t('hoy.moodHeroFirstStep', { task: firstFocusTaskName })
      : null;

  const coachAddsValue =
    Boolean(coachLine) &&
    !coachLineRepeatsMood(coachLine, emotionLabel, energyLevel) &&
    coachLine !== koraaLine;

  const detailLine = taskHint ?? (compact ? null : coachAddsValue ? coachLine : null);

  const cardStyles = compact ? styles.cardCompact : styles.card;
  const emojiStyle = compact ? styles.emojiCompact : styles.emoji;

  const content = (
    <>
      <Text style={styles.eyebrow}>{t('hoy.focusMoodLabel')}</Text>
      <View style={styles.moodRow}>
        <Text style={emojiStyle} accessibilityLabel={emotionLabel}>
          {emotionEmoji}
        </Text>
        <View style={styles.moodTextCol}>
          <Text style={styles.emotion} numberOfLines={1}>
            {emotionLabel}
          </Text>
          <Text style={styles.energy}>{t('hoy.moodHeroEnergy', { level: energyLevel })}</Text>
        </View>
      </View>
      <Text style={styles.koraaLine} numberOfLines={compact ? 2 : 3}>
        {koraaLine}
      </Text>
      {detailLine ? (
        <Text style={styles.coach} numberOfLines={2}>
          {detailLine}
        </Text>
      ) : null}
    </>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.pressable,
        pressed && onPress ? styles.pressablePressed : null,
      ]}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? t('hoy.heroUpdateCheckIn') : undefined}
      accessibilityHint={onPress ? t('hoy.focusUpdateCheckInA11y') : undefined}
    >
      <LinearGradient
        colors={[THEME.colors.gradient.blue, THEME.colors.calm.lavenderDeep, THEME.colors.gradient.pink]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={cardStyles}
      >
        {content}
      </LinearGradient>
    </Pressable>
  );
}

function coachLineRepeatsMood(line: string, emotionLabel: string, energyLevel: number): boolean {
  const lower = line.toLowerCase();
  const emotion = emotionLabel.toLowerCase();
  if (!lower.includes(emotion)) return false;
  return (
    lower.includes(`${energyLevel}/5`) ||
    lower.includes(`energy ${energyLevel}`) ||
    lower.includes(`energía ${energyLevel}`)
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
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    gap: 4,
    ...THEME.shadows.soft,
  },
  cardCompact: {
    borderRadius: THEME.borderRadius.rounded,
    paddingVertical: THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.sm,
    gap: 2,
    ...THEME.shadows.soft,
  },
  eyebrow: {
    ...THEME.typography.meta,
    fontSize: 11,
    color: THEME.colors.onGradientMuted,
    fontFamily: THEME.fonts.heading.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  moodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    marginTop: 2,
  },
  emoji: {
    fontSize: 36,
    lineHeight: 40,
  },
  emojiCompact: {
    fontSize: 30,
    lineHeight: 34,
  },
  moodTextCol: {
    flex: 1,
    gap: 0,
  },
  emotion: {
    ...THEME.typography.h3,
    fontSize: 20,
    lineHeight: 24,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.onGradient,
  },
  energy: {
    ...THEME.typography.caption,
    fontSize: 13,
    lineHeight: 18,
    color: THEME.colors.onGradientSoft,
    fontFamily: THEME.fonts.heading.medium,
  },
  koraaLine: {
    ...THEME.typography.caption,
    fontSize: 14,
    lineHeight: 20,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.medium,
    marginTop: 4,
  },
  coach: {
    ...THEME.typography.small,
    fontSize: 12,
    lineHeight: 17,
    color: THEME.colors.onGradientMuted,
    marginTop: 2,
  },
});
