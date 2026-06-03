import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { PenTool, Heart, Target, ArrowRight, ChevronRight } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

type FlowPhase = 'tasks' | 'feel' | 'today';

type HoyHowItWorksCardProps = {
  hasCheckInToday: boolean;
  hasTasks: boolean;
};

function resolveFlowPhase(hasCheckInToday: boolean, hasTasks: boolean): FlowPhase {
  if (hasCheckInToday) return 'today';
  if (hasTasks) return 'feel';
  return 'tasks';
}

export function HoyHowItWorksCard({ hasCheckInToday, hasTasks }: HoyHowItWorksCardProps) {
  const { t } = useI18n();
  const phase = resolveFlowPhase(hasCheckInToday, hasTasks);
  const isActionable = phase !== 'today';

  const handlePress = () => {
    if (phase === 'tasks') {
      router.push('/(tabs)/vaciar');
      return;
    }
    if (phase === 'feel') {
      router.push('/(tabs)/sentir');
    }
  };

  const bodyCopy =
    phase === 'today'
      ? t('hoy.howItWorksBodyCheckedIn')
      : phase === 'feel'
        ? t('hoy.howItWorksBody')
        : t('hoy.howItWorksBodyNoTasks');

  const ctaCopy =
    phase === 'today'
      ? t('hoy.focusCtaBelow')
      : phase === 'feel'
        ? t('hoy.goToFeel')
        : t('hoy.goToTasks');

  const a11yLabel =
    phase === 'tasks'
      ? t('hoyExtra.howWorksA11yNoTasks')
      : phase === 'feel'
        ? t('hoyExtra.howWorksA11y')
        : t('hoyExtra.howWorksA11y');

  const a11yHint =
    phase === 'tasks'
      ? t('hoyExtra.howWorksHintNoTasks')
      : phase === 'feel'
        ? t('hoyExtra.howWorksHint')
        : undefined;

  return (
    <TouchableOpacity
      style={styles.howKoraaCard}
      onPress={handlePress}
      activeOpacity={isActionable ? 0.88 : 1}
      disabled={!isActionable}
      accessibilityRole={isActionable ? 'button' : 'text'}
      accessibilityLabel={a11yLabel}
      accessibilityHint={a11yHint}
    >
      <LinearGradient
        colors={[THEME.colors.gradient.blue + '12', THEME.colors.gradient.pink + '08']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.howKoraaCardGradient}
      >
        <Text style={styles.howKoraaCardTitle}>{t('hoy.howItWorksTitle')}</Text>
        <Text style={styles.howKoraaCardBody}>{bodyCopy}</Text>
        <View style={styles.howKoraaCardFlow}>
          <View style={styles.howKoraaCardStep}>
            <View
              style={[
                styles.howKoraaCardStepDot,
                phase === 'tasks' && styles.howKoraaCardStepDotActive,
              ]}
            >
              <PenTool
                size={12}
                color={phase === 'tasks' ? THEME.colors.onGradient : THEME.colors.gradient.blue}
              />
            </View>
            <Text
              style={[
                styles.howKoraaCardStepLabel,
                phase === 'tasks' && styles.howKoraaCardStepLabelActive,
              ]}
            >
              {t('tabs.tasks')}
            </Text>
          </View>
          <View style={styles.howKoraaCardArrow}>
            <ArrowRight size={14} color={THEME.colors.text.tertiary} />
          </View>
          <View style={styles.howKoraaCardStep}>
            <View
              style={[
                styles.howKoraaCardStepDot,
                phase === 'feel' && styles.howKoraaCardStepDotActive,
              ]}
            >
              <Heart
                size={12}
                color={phase === 'feel' ? THEME.colors.onGradient : THEME.colors.gradient.blue}
              />
            </View>
            <Text
              style={[
                styles.howKoraaCardStepLabel,
                phase === 'feel' && styles.howKoraaCardStepLabelActive,
              ]}
            >
              {t('tabs.feel')}
            </Text>
          </View>
          <View style={styles.howKoraaCardArrow}>
            <ArrowRight size={14} color={THEME.colors.text.tertiary} />
          </View>
          <View style={styles.howKoraaCardStep}>
            <View
              style={[
                styles.howKoraaCardStepDot,
                phase === 'today' && styles.howKoraaCardStepDotActive,
              ]}
            >
              <Target
                size={12}
                color={phase === 'today' ? THEME.colors.onGradient : THEME.colors.text.secondary}
              />
            </View>
            <Text
              style={[
                styles.howKoraaCardStepLabel,
                phase === 'today' && styles.howKoraaCardStepLabelActive,
              ]}
            >
              {t('tabs.today')}
            </Text>
          </View>
        </View>
        <View style={styles.howKoraaCardCta}>
          <Text style={styles.howKoraaCardCtaText}>{ctaCopy}</Text>
          {isActionable ? <ChevronRight size={18} color={THEME.colors.gradient.blue} /> : null}
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
  howKoraaCardStepLabelActive: {
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
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
