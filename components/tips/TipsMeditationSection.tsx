import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Info } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { showsSimplifiedMeditationNotice } from '@/lib/meditationEnvironment';
import { getSituationalMeditationType } from '@/lib/meditationSituational';

type TipsMeditationSectionProps = {
  morningDone: boolean;
  eveningDone: boolean;
  onStartMorning: () => void;
  onStartEvening: () => void;
};

export function TipsMeditationSection({
  morningDone,
  eveningDone,
  onStartMorning,
  onStartEvening,
}: TipsMeditationSectionProps) {
  const { t } = useI18n();
  const showExpoGoNote = showsSimplifiedMeditationNotice();
  const pauseType = getSituationalMeditationType(morningDone, eveningDone);

  const handlePauseNow = () => {
    if (pauseType === 'morning') {
      onStartMorning();
    } else {
      onStartEvening();
    }
  };

  const showStatus = morningDone || eveningDone;

  return (
    <View
      style={styles.section}
      accessibilityRole="summary"
      accessibilityLabel={t('tipsExtra.a11yMeditationSection')}
    >
      <Text style={styles.eyebrow}>{t('tips.meditationEyebrow')}</Text>
      <View style={styles.cardWrap}>
        <LinearGradient
          colors={[
            THEME.colors.calm.lavender,
            THEME.colors.tint.blue.veryFaint,
            THEME.colors.tint.pink.soft,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <Text style={styles.title}>
            {t('tips.meditationTitle')}{' '}
            <Text style={styles.titleAccent}>{t('tips.meditationTitleAccent')}</Text>
          </Text>
          <Text style={styles.lead}>{t('tips.meditationPauseLead')}</Text>

          {showExpoGoNote ? (
            <View style={styles.expoGoNote} accessibilityRole="text">
              <Info size={16} color={THEME.colors.gradient.blue} />
              <Text style={styles.expoGoNoteText}>{t('hoy.meditationExpoGoNote')}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.pauseBtn}
            onPress={handlePauseNow}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={t('tips.meditationPauseCta')}
            accessibilityHint={t('tipsExtra.a11yMeditationPauseHint')}
          >
            <Text style={styles.pauseBtnEmoji}>🧘</Text>
            <Text style={styles.pauseBtnText}>{t('tips.meditationPauseCta')}</Text>
          </TouchableOpacity>

          {showStatus ? (
            <Text style={styles.statusLine} accessibilityRole="text">
              {morningDone ? t('tips.meditationMorningDoneShort') : null}
              {morningDone && eveningDone ? ' · ' : null}
              {eveningDone ? t('tips.meditationEveningDoneShort') : null}
            </Text>
          ) : null}
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: THEME.spacing.xs,
    alignSelf: 'stretch',
  },
  eyebrow: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    fontSize: 11,
    paddingHorizontal: THEME.spacing.xs,
  },
  cardWrap: {
    borderRadius: THEME.borderRadius.rounded + 4,
    overflow: 'hidden',
    ...THEME.shadows.soft,
  },
  card: {
    paddingVertical: THEME.spacing.lg,
    paddingHorizontal: THEME.spacing.md,
    gap: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
    borderRadius: THEME.borderRadius.rounded + 4,
  },
  title: {
    ...THEME.typography.h3,
    fontSize: 20,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    letterSpacing: 0.2,
    paddingHorizontal: THEME.spacing.xs,
  },
  titleAccent: {
    fontFamily: THEME.fonts.accent.italic,
    color: THEME.colors.gradient.pink,
    fontStyle: 'italic',
  },
  lead: {
    ...THEME.typography.caption,
    fontSize: 13,
    color: THEME.colors.text.secondary,
    fontStyle: 'italic',
    letterSpacing: 0.3,
    lineHeight: 18,
    paddingHorizontal: THEME.spacing.xs,
  },
  expoGoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.xs,
  },
  expoGoNoteText: {
    ...THEME.typography.meta,
    color: THEME.colors.text.metaOnFill,
    flex: 1,
    lineHeight: 18,
  },
  pauseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.sm,
    minHeight: THEME.sizes.touchTarget + 4,
    marginTop: THEME.spacing.xs,
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
    ...THEME.shadows.soft,
  },
  pauseBtnEmoji: {
    fontSize: 22,
  },
  pauseBtnText: {
    fontSize: 16,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
  },
  statusLine: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    paddingTop: THEME.spacing.xs,
  },
});
