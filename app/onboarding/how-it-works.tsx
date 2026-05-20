import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { GradientButton } from '@/components/GradientButton';
import { ArrowRight, PenTool, Heart, Target } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { markOnboardingCompleted } from '@/lib/onboardingGate';
import { useI18n } from '@/contexts/I18nContext';

export default function HowItWorksScreen() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);

  const handleContinue = async () => {
    if (user) {
      setSaving(true);
      const { error } = await markOnboardingCompleted(user.id);
      setSaving(false);
      if (error) {
        Alert.alert(t('errors.continueFailed'), t('errors.saveProgressFailed'));
        return;
      }
    }
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t('onboarding.howItWorks.title')}</Text>
        <Text style={styles.titleAccent}>{t('onboarding.howItWorks.titleAccent')}</Text>
        <Text style={styles.subtitle}>{t('onboarding.howItWorks.subtitle')}</Text>

        {/* Paso 1 */}
        <View style={styles.stepContainer}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <PenTool size={24} color={THEME.colors.gradient.blue} />
              <Text style={styles.stepTitle}>{t('onboarding.howItWorks.step1Title')}</Text>
            </View>
            <Text style={styles.stepDescription}>{t('onboarding.howItWorks.step1Body')}</Text>
            <View style={styles.exampleCard}>
              <Text style={styles.exampleText}>{t('onboarding.howItWorks.exampleTask1')}</Text>
              <Text style={styles.exampleText}>{t('onboarding.howItWorks.exampleTask2')}</Text>
              <Text style={styles.exampleText}>{t('onboarding.howItWorks.exampleTask3')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.arrowContainer}>
          <ArrowRight size={24} color={THEME.colors.text.secondary} />
        </View>

        {/* Paso 2 */}
        <View style={styles.stepContainer}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <Heart size={24} color={THEME.colors.gradient.pink} />
              <Text style={styles.stepTitle}>{t('onboarding.howItWorks.step2Title')}</Text>
            </View>
            <Text style={styles.stepDescription}>{t('onboarding.howItWorks.step2Body')}</Text>
            <View style={styles.exampleCard}>
              <View style={styles.exampleRow}>
                <Text style={styles.exampleLabel}>{t('onboarding.howItWorks.emotionLabel')}</Text>
                <Text style={styles.exampleValue}>{t('onboarding.howItWorks.emotionExample')}</Text>
              </View>
              <View style={styles.exampleRow}>
                <Text style={styles.exampleLabel}>{t('onboarding.howItWorks.energyLabel')}</Text>
                <Text style={styles.exampleValue}>4/5</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.arrowContainer}>
          <ArrowRight size={24} color={THEME.colors.text.secondary} />
        </View>

        {/* Paso 3 */}
        <View style={styles.stepContainer}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <Target size={24} color={THEME.colors.gradient.blue} />
              <Text style={styles.stepTitle}>{t('onboarding.howItWorks.step3Title')}</Text>
            </View>
            <Text style={styles.stepDescription}>{t('onboarding.howItWorks.step3Body')}</Text>
            <View style={styles.exampleCard}>
              <View style={styles.priorityExample}>
                <View style={styles.priorityNumber}>
                  <Text style={styles.priorityNumberText}>1</Text>
                </View>
                <Text style={styles.priorityText}>{t('onboarding.howItWorks.priorityTask1')}</Text>
              </View>
              <View style={styles.priorityExample}>
                <View style={styles.priorityNumber}>
                  <Text style={styles.priorityNumberText}>2</Text>
                </View>
                <Text style={styles.priorityText}>{t('onboarding.howItWorks.priorityTask2')}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Ejemplo de adaptación */}
        <View style={styles.adaptationCard}>
          <LinearGradient
            colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.adaptationGradient}
          >
            <Text style={styles.adaptationTitle}>{t('onboarding.howItWorks.adaptTitle')}</Text>
            <Text style={styles.adaptationText}>{t('onboarding.howItWorks.adaptBody')}</Text>
          </LinearGradient>
        </View>

        <View style={styles.dotContainer}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {saving ? (
          <ActivityIndicator size="large" color={THEME.colors.gradient.blue} />
        ) : (
          <GradientButton title={t('onboarding.howItWorks.continue')} onPress={handleContinue} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.fill[100],
  },
  content: {
    padding: THEME.spacing.lg,
    paddingTop: THEME.spacing.xl * 2,
  },
  title: {
    ...THEME.typography.h1,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.xs,
  },
  titleAccent: {
    ...THEME.typography.h1,
    fontFamily: THEME.fonts.accent.italic,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.sm,
  },
  subtitle: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.xl,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: THEME.spacing.lg,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.gradient.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: THEME.spacing.md,
  },
  stepNumberText: {
    ...THEME.typography.h3,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
  },
  stepContent: {
    flex: 1,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    marginBottom: THEME.spacing.xs,
  },
  stepTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
  },
  stepDescription: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 24,
    marginBottom: THEME.spacing.sm,
  },
  exampleCard: {
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    ...THEME.shadows.soft,
  },
  exampleText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.xs,
  },
  exampleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.xs,
  },
  exampleLabel: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
  },
  exampleValue: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  priorityExample: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.spacing.xs,
    gap: THEME.spacing.sm,
  },
  priorityNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: THEME.colors.gradient.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityNumberText: {
    ...THEME.typography.caption,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
  },
  priorityText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    flex: 1,
  },
  arrowContainer: {
    alignItems: 'center',
    marginVertical: THEME.spacing.sm,
  },
  adaptationCard: {
    borderRadius: THEME.borderRadius.rounded,
    overflow: 'hidden',
    marginTop: THEME.spacing.lg,
    marginBottom: THEME.spacing.lg,
    ...THEME.shadows.soft,
  },
  adaptationGradient: {
    padding: THEME.spacing.lg,
  },
  adaptationTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.onGradient,
    marginBottom: THEME.spacing.sm,
  },
  adaptationText: {
    ...THEME.typography.body,
    color: THEME.colors.onGradient,
    lineHeight: 24,
  },
  dotContainer: {
    flexDirection: 'row',
    gap: THEME.spacing.xs,
    marginTop: THEME.spacing.lg,
    justifyContent: 'center',
  },
  dot: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME.colors.stroke[100],
  },
  dotActive: {
    backgroundColor: THEME.colors.gradient.blue,
  },
  footer: {
    padding: THEME.spacing.lg,
    paddingBottom: THEME.spacing.xl,
  },
});
