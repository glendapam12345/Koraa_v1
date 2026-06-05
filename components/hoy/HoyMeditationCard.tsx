import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Info } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { showsSimplifiedMeditationNotice } from '@/lib/meditationEnvironment';

type HoyMeditationCardProps = {
  morningDone: boolean;
  eveningDone: boolean;
  onStartMorning: () => void;
  onStartEvening: () => void;
};

export function HoyMeditationCard({
  morningDone,
  eveningDone,
  onStartMorning,
  onStartEvening,
}: HoyMeditationCardProps) {
  const { t } = useI18n();
  const showExpoGoNote = showsSimplifiedMeditationNotice();

  return (
    <View style={styles.meditationWrap}>
      <LinearGradient
        colors={[THEME.colors.tint.blue.veryFaint, THEME.colors.tint.pink.soft, THEME.colors.fill[200]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.meditationCard}
      >
        <View style={styles.meditationHeader}>
          <Text style={styles.meditationTitle}>
            {t('hoy.calmMoment')}{' '}
            <Text style={styles.meditationTitleAccent}>{t('hoy.calmMomentAccent')}</Text>
          </Text>
          <Text style={styles.meditationSubtitle}>{t('commonExtra.meditationListen')}</Text>
        </View>
        {showExpoGoNote ? (
          <View style={styles.expoGoNote} accessibilityRole="text">
            <Info size={16} color={THEME.colors.gradient.blue} />
            <Text style={styles.expoGoNoteText}>{t('hoy.meditationExpoGoNote')}</Text>
          </View>
        ) : null}
        <View style={styles.meditationSingleCardInner}>
          <TouchableOpacity
            style={[styles.meditationRow, morningDone && styles.meditationRowDone]}
            onPress={onStartMorning}
            activeOpacity={0.8}
            disabled={morningDone}
            accessibilityRole="button"
            accessibilityLabel={
              morningDone ? t('hoy.meditationMorningDoneA11y') : t('hoy.meditationMorningA11y')
            }
            accessibilityHint={t('hoy.meditationMorningHint')}
            accessibilityState={{ disabled: morningDone }}
          >
            <View style={[styles.meditationRowIconWrap, !morningDone && styles.meditationRowIconMorning]}>
              <Text style={styles.meditationRowEmoji}>🧘</Text>
              {morningDone && (
                <View style={styles.meditationCheckBadge}>
                  <Text style={styles.meditationCheckText}>✓</Text>
                </View>
              )}
            </View>
            <View style={styles.meditationRowTextWrap}>
              <Text style={[styles.meditationRowLabel, morningDone && styles.meditationRowLabelDone]}>
                {morningDone ? t('hoy.morningDone') : t('hoy.morning')}
              </Text>
              {!morningDone && <Text style={styles.meditationRowHint}>{t('hoy.morningHint')}</Text>}
            </View>
            {!morningDone && <ChevronRight size={20} color={THEME.colors.text.tertiary} />}
          </TouchableOpacity>
          <View style={styles.meditationDivider} />
          <TouchableOpacity
            style={[styles.meditationRow, eveningDone && styles.meditationRowDone]}
            onPress={onStartEvening}
            activeOpacity={0.8}
            disabled={eveningDone}
            accessibilityRole="button"
            accessibilityLabel={
              eveningDone ? t('hoy.meditationEveningDoneA11y') : t('hoy.meditationEveningA11y')
            }
            accessibilityHint={t('hoy.meditationEveningHint')}
            accessibilityState={{ disabled: eveningDone }}
          >
            <View style={[styles.meditationRowIconWrap, !eveningDone && styles.meditationRowIconEvening]}>
              <Text style={styles.meditationRowEmoji}>🌙</Text>
              {eveningDone && (
                <View style={styles.meditationCheckBadge}>
                  <Text style={styles.meditationCheckText}>✓</Text>
                </View>
              )}
            </View>
            <View style={styles.meditationRowTextWrap}>
              <Text style={[styles.meditationRowLabel, eveningDone && styles.meditationRowLabelDone]}>
                {eveningDone ? t('hoy.eveningDone') : t('hoy.evening')}
              </Text>
              {!eveningDone && (
                <Text style={styles.meditationRowHint}>{t('commonExtra.eveningHintPeace')}</Text>
              )}
            </View>
            {!eveningDone && <ChevronRight size={20} color={THEME.colors.text.tertiary} />}
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  meditationWrap: {
    marginBottom: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.rounded + 4,
    overflow: 'hidden',
    ...THEME.shadows.soft,
  },
  meditationCard: {
    paddingVertical: THEME.spacing.lg,
    paddingHorizontal: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
    borderRadius: THEME.borderRadius.rounded + 4,
  },
  meditationHeader: {
    marginBottom: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.xs,
  },
  meditationTitle: {
    ...THEME.typography.h3,
    fontSize: 20,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    letterSpacing: 0.2,
  },
  meditationTitleAccent: {
    fontFamily: THEME.fonts.accent.italic,
    color: THEME.colors.gradient.pink,
    fontStyle: 'italic',
  },
  meditationSubtitle: {
    ...THEME.typography.caption,
    fontSize: 13,
    color: THEME.colors.text.secondary,
    marginTop: 4,
    fontStyle: 'italic',
    letterSpacing: 0.3,
  },
  expoGoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.xs,
    marginBottom: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.xs,
  },
  expoGoNoteText: {
    ...THEME.typography.meta,
    color: THEME.colors.text.metaOnFill,
    flex: 1,
    lineHeight: 18,
  },
  meditationSingleCardInner: {
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    overflow: 'hidden',
    ...THEME.shadows.soft,
  },
  meditationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.md,
    gap: THEME.spacing.sm,
    minHeight: THEME.sizes.touchTarget,
  },
  meditationRowDone: {
    opacity: 0.78,
  },
  meditationRowIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  meditationRowIconMorning: {
    backgroundColor: THEME.colors.tint.pink.soft,
  },
  meditationRowIconEvening: {
    backgroundColor: THEME.colors.tint.blue.veryFaint,
  },
  meditationRowEmoji: {
    fontSize: 24,
  },
  meditationRowTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  meditationRowLabel: {
    fontSize: 16,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  meditationRowLabelDone: {
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
  },
  meditationRowHint: {
    ...THEME.typography.small,
    fontSize: 13,
    color: THEME.colors.text.secondary,
    marginTop: 2,
  },
  meditationDivider: {
    height: 1,
    backgroundColor: THEME.colors.stroke[100],
    marginLeft: THEME.spacing.md + 44 + THEME.spacing.sm,
  },
  meditationCheckBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: THEME.colors.semantic.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meditationCheckText: {
    ...THEME.typography.meta,
    color: THEME.colors.fill[100],
    fontFamily: THEME.fonts.heading.bold,
  },
});
