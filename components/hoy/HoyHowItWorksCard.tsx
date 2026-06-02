import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { PenTool, Heart, Target, ArrowRight, ChevronRight } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

type HoyHowItWorksCardProps = {
  hasCheckInToday: boolean;
};

export function HoyHowItWorksCard({ hasCheckInToday }: HoyHowItWorksCardProps) {
  const { t } = useI18n();

  return (
    <TouchableOpacity
      style={styles.howKoraaCard}
      onPress={() => router.push('/(tabs)/sentir')}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={t('hoyExtra.howWorksA11y')}
      accessibilityHint={t('hoyExtra.howWorksHint')}
    >
      <LinearGradient
        colors={[THEME.colors.gradient.blue + '12', THEME.colors.gradient.pink + '08']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.howKoraaCardGradient}
      >
        <Text style={styles.howKoraaCardTitle}>{t('hoy.howItWorksTitle')}</Text>
        <Text style={styles.howKoraaCardBody}>{t('hoy.howItWorksBody')}</Text>
        <View style={styles.howKoraaCardFlow}>
          <View style={styles.howKoraaCardStep}>
            <View style={[styles.howKoraaCardStepDot, styles.howKoraaCardStepDotActive]}>
              <PenTool size={12} color={THEME.colors.onGradient} />
            </View>
            <Text style={styles.howKoraaCardStepLabel}>{t('tabs.tasks')}</Text>
          </View>
          <View style={styles.howKoraaCardArrow}>
            <ArrowRight size={14} color={THEME.colors.text.tertiary} />
          </View>
          <View style={styles.howKoraaCardStep}>
            <View style={styles.howKoraaCardStepDot}>
              <Heart size={12} color={THEME.colors.gradient.blue} />
            </View>
            <Text style={styles.howKoraaCardStepLabel}>{t('tabs.feel')}</Text>
          </View>
          <View style={styles.howKoraaCardArrow}>
            <ArrowRight size={14} color={THEME.colors.text.tertiary} />
          </View>
          <View style={styles.howKoraaCardStep}>
            <View style={styles.howKoraaCardStepDot}>
              <Target size={12} color={THEME.colors.text.secondary} />
            </View>
            <Text style={styles.howKoraaCardStepLabel}>{t('tabs.today')}</Text>
          </View>
        </View>
        <View style={styles.howKoraaCardCta}>
          <Text style={styles.howKoraaCardCtaText}>
            {hasCheckInToday ? t('hoy.updateFeel') : t('hoy.goToFeel')}
          </Text>
          <ChevronRight size={18} color={THEME.colors.gradient.blue} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  howKoraaCard: {
    marginHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
    ...THEME.shadows.soft,
  },
  howKoraaCardGradient: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: THEME.spacing.sm + 4,
    paddingHorizontal: THEME.spacing.md,
  },
  howKoraaCardTitle: {
    ...THEME.typography.body,
    fontSize: 16,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    marginBottom: 4,
    textAlign: 'center',
  },
  howKoraaCardBody: {
    ...THEME.typography.body,
    fontSize: 13,
    lineHeight: 20,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.sm,
    textAlign: 'center',
  },
  howKoraaCardFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: THEME.spacing.sm,
  },
  howKoraaCardStep: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  howKoraaCardStepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: THEME.colors.fill[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  howKoraaCardStepDotActive: {
    backgroundColor: THEME.colors.gradient.blue,
  },
  howKoraaCardStepLabel: {
    ...THEME.typography.caption,
    fontSize: 12,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
  },
  howKoraaCardArrow: {
    marginHorizontal: 2,
  },
  howKoraaCardCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  howKoraaCardCtaText: {
    fontSize: 15,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.gradient.blue,
    letterSpacing: 0.2,
  },
});
