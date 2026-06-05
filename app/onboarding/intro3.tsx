import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { OnboardingHighlightCard } from '@/components/onboarding/OnboardingHighlightCard';
import { OnboardingProgressDots } from '@/components/onboarding/OnboardingProgressDots';
import { Sparkles, ChevronDown } from 'lucide-react-native';
import { useI18n } from '@/contexts/I18nContext';

export default function Intro3Screen() {
  const { t } = useI18n();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Sparkles size={32} color={THEME.colors.gradient.pink} />
          </View>
        </View>

        <Text style={styles.title}>{t('onboarding.intro3.title')}</Text>
        <Text style={styles.titleAccent}>{t('onboarding.intro3.titleAccent')}</Text>
        <Text style={styles.description}>{t('onboarding.intro3.subtitle')}</Text>

        <View
          style={styles.flowContainer}
          accessibilityRole="summary"
          accessibilityLabel={t('onboardingA11y.intro3FlowGroup')}
        >
          <View
            style={styles.flowStep}
            accessible
            accessibilityRole="text"
            accessibilityLabel={t('onboardingA11y.flowStep', {
              step: 1,
              title: t('onboarding.intro3.step1Title'),
              body: t('onboarding.intro3.step1Desc'),
            })}
          >
            <View style={styles.flowStepNumber}><Text style={styles.flowStepNumberText}>1</Text></View>
            <View style={styles.flowStepContent}>
              <Text style={styles.flowStepTitle}>{t('onboarding.intro3.step1Title')}</Text>
              <Text style={styles.flowStepDesc}>{t('onboarding.intro3.step1Desc')}</Text>
            </View>
          </View>
          <View style={styles.flowArrowDown} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
            <ChevronDown size={24} color={THEME.colors.text.secondary} />
          </View>
          <View
            style={styles.flowStep}
            accessible
            accessibilityRole="text"
            accessibilityLabel={t('onboardingA11y.flowStep', {
              step: 2,
              title: t('onboarding.intro3.step2Title'),
              body: t('onboarding.intro3.step2Desc'),
            })}
          >
            <View style={styles.flowStepNumber}><Text style={styles.flowStepNumberText}>2</Text></View>
            <View style={styles.flowStepContent}>
              <Text style={styles.flowStepTitle}>{t('onboarding.intro3.step2Title')}</Text>
              <Text style={styles.flowStepDesc}>{t('onboarding.intro3.step2Desc')}</Text>
            </View>
          </View>
          <View style={styles.flowArrowDown} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
            <ChevronDown size={24} color={THEME.colors.text.secondary} />
          </View>
          <View
            style={styles.flowStep}
            accessible
            accessibilityRole="text"
            accessibilityLabel={t('onboardingA11y.flowStep', {
              step: 3,
              title: t('onboarding.intro3.step3Title'),
              body: t('onboarding.intro3.step3Desc'),
            })}
          >
            <View style={styles.flowStepNumber}><Text style={styles.flowStepNumberText}>3</Text></View>
            <View style={styles.flowStepContent}>
              <Text style={styles.flowStepTitle}>{t('onboarding.intro3.step3Title')}</Text>
              <Text style={styles.flowStepDesc}>{t('onboarding.intro3.step3Desc')}</Text>
            </View>
          </View>
        </View>

        <OnboardingHighlightCard
          title={t('onboarding.intro3.resultTitle')}
          body={t('onboarding.intro3.resultBody')}
        />

        <OnboardingProgressDots total={3} activeIndex={2} style={styles.dotContainer} />
      </ScrollView>

      <View style={styles.footer}>
        <CalmPrimaryButton
          label={t('onboarding.intro3.continue')}
          onPress={() => router.push('/onboarding/how-it-works')}
          accessibilityHint={t('onboardingA11y.intro3ContinueHint')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', alignSelf: 'stretch', backgroundColor: THEME.colors.fill[100] },
  scrollView: { flex: 1, width: '100%' },
  content: { width: '100%', padding: THEME.spacing.lg, paddingTop: THEME.spacing.xl * 2 },
  iconContainer: { alignItems: 'flex-end', marginBottom: THEME.spacing.xl },
  iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: THEME.colors.fill[200], alignItems: 'center', justifyContent: 'center' },
  title: { ...THEME.typography.h1, color: THEME.colors.text.main, marginBottom: THEME.spacing.xs },
  titleAccent: { ...THEME.typography.h1, fontFamily: THEME.fonts.accent.italic, color: THEME.colors.text.main, marginBottom: THEME.spacing.lg },
  description: { ...THEME.typography.body, color: THEME.colors.text.secondary, lineHeight: 28 },
  dotContainer: { marginTop: THEME.spacing.xl },
  footer: { padding: THEME.spacing.lg, paddingBottom: THEME.spacing.xl },
  flowContainer: { marginTop: THEME.spacing.xl, marginBottom: THEME.spacing.lg, width: '100%' },
  flowStep: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  flowStepNumber: { width: 40, height: 40, borderRadius: 20, backgroundColor: THEME.colors.gradient.blue, alignItems: 'center', justifyContent: 'center', marginRight: THEME.spacing.md },
  flowStepNumberText: { ...THEME.typography.body, color: THEME.colors.onGradient, fontFamily: THEME.fonts.heading.bold },
  flowStepContent: { flex: 1, minWidth: 0 },
  flowStepTitle: { ...THEME.typography.h3, color: THEME.colors.text.main, fontFamily: THEME.fonts.heading.bold, marginBottom: 4 },
  flowStepDesc: { ...THEME.typography.body, color: THEME.colors.text.secondary, lineHeight: 22 },
  flowArrowDown: { alignItems: 'center', justifyContent: 'center', paddingVertical: THEME.spacing.sm, marginBottom: THEME.spacing.xs },
});
