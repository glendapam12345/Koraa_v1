import { View, Text, StyleSheet, Pressable } from 'react-native';
import { THEME } from '@/constants/theme';
import { CalmCard } from '@/components/ui/calm/CalmCard';
import { useI18n } from '@/contexts/I18nContext';
import { isLateNight } from '@/lib/timeOfDayContext';

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
  /** Modo cuidado: copy emocional distinto en el hero. */
  crisisMode?: boolean;
};

export function HoyMoodHeroCard({
  emotionEmoji,
  emotionLabel,
  energyLevel,
  focusCount,
  restCount: _restCount,
  firstFocusTaskName: _firstFocusTaskName,
  coachLine,
  allFocusDone,
  compact = false,
  onPress,
  crisisMode = false,
}: HoyMoodHeroCardProps) {
  const { t } = useI18n();

  const koraaLine = crisisMode
    ? t('hoy.crisisMoodHero')
    : isLateNight()
      ? focusCount > 0
        ? t('hoy.nightMoodHeroWithSteps')
        : t('hoy.nightMoodHeroLead')
      : focusCount > 0
        ? compact
          ? t('hoy.moodHeroLiteWithSteps', { count: focusCount })
          : t('hoy.moodHeroPlanLead')
        : t('hoy.moodHeroLiteNoSteps');

  const taskHint = null;

  const coachAddsValue =
    Boolean(coachLine) &&
    !coachLineRepeatsMood(coachLine, emotionLabel, energyLevel) &&
    coachLine !== koraaLine;

  const detailLine =
    isLateNight() || taskHint
      ? taskHint
      : compact
        ? null
        : coachAddsValue
          ? coachLine
          : null;

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
          <Text style={[styles.emotion, compact && styles.emotionCompact]} numberOfLines={1}>
            {emotionLabel}
          </Text>
          <Text style={styles.energy}>{t('hoy.moodHeroEnergy', { level: energyLevel })}</Text>
        </View>
      </View>
      <Text style={[styles.koraaLine, compact && styles.koraaLineCompact]} numberOfLines={compact ? 1 : 3}>
        {koraaLine}
      </Text>
      {detailLine ? (
        <Text style={styles.coach} numberOfLines={2}>
          {detailLine}
        </Text>
      ) : null}
      {onPress ? (
        <Text style={styles.updateLink}>{t('hoy.updateFeel')} →</Text>
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
      <CalmCard style={[cardStyles, styles.cardSurface]}>
        {content}
      </CalmCard>
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
  },
  cardCompact: {
    paddingVertical: 10,
    paddingHorizontal: THEME.spacing.sm,
    gap: 2,
  },
  cardSurface: {
    backgroundColor: THEME.colors.calm.mist,
    borderColor: THEME.colors.calm.lavender,
    borderWidth: 1,
    gap: 4,
  },
  eyebrow: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
    lineHeight: 18,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
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
    fontSize: 26,
    lineHeight: 30,
  },
  moodTextCol: {
    flex: 1,
    gap: 0,
  },
  emotion: {
    ...THEME.typography.sectionTitle,
    lineHeight: 24,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  emotionCompact: {
    ...THEME.typography.body,
    lineHeight: 20,
    fontFamily: THEME.fonts.heading.medium,
  },
  energy: {
    ...THEME.typography.meta,
    lineHeight: 18,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
  },
  koraaLine: {
    ...THEME.typography.caption,
    lineHeight: 20,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
    marginTop: 4,
  },
  koraaLineCompact: {
    ...THEME.typography.small,
    lineHeight: 16,
    marginTop: 2,
  },
  coach: {
    ...THEME.typography.small,
    lineHeight: 17,
    color: THEME.colors.text.secondary,
    marginTop: 2,
  },
  updateLink: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
    lineHeight: 18,
    marginTop: 6,
  },
});
