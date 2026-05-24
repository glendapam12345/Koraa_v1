import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { GradientButton } from '@/components/GradientButton';
import { Wind } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { markOnboardingCompleted } from '@/lib/onboardingGate';
import { useI18n } from '@/contexts/I18nContext';

export default function Intro2Screen() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [skipLoading, setSkipLoading] = useState(false);

  const handleSkipIntro = async () => {
    if (!user?.id) {
      router.replace('/auth/login');
      return;
    }
    setSkipLoading(true);
    const { error } = await markOnboardingCompleted(user.id);
    setSkipLoading(false);
    if (error) {
      Alert.alert(t('errors.continueFailed'), t('errors.saveProgressFailed'));
      return;
    }
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Wind size={32} color={THEME.colors.gradient.blue} />
          </View>
        </View>

        <Text style={styles.title}>{t('onboarding.intro2.title')}</Text>
        <Text style={styles.titleAccent}>{t('onboarding.intro2.titleAccent')}</Text>
        <Text style={styles.description}>{t('onboarding.intro2.subtitle')}</Text>

        <View style={styles.previewContainer}>
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>{t('onboarding.intro2.previewTitle')}</Text>
            </View>
            <View style={styles.previewInput}>
              <Text style={styles.previewInputText}>{t('onboarding.intro2.preview')}</Text>
            </View>
            <View style={styles.previewExamples}>
              <View style={styles.previewExampleItem}>
                <Text style={styles.previewExampleText}>{t('onboarding.intro2.example1')}</Text>
              </View>
              <View style={styles.previewExampleItem}>
                <Text style={styles.previewExampleText}>{t('onboarding.intro2.example2')}</Text>
              </View>
              <View style={styles.previewExampleItem}>
                <Text style={styles.previewExampleText}>{t('onboarding.intro2.example3')}</Text>
              </View>
            </View>
            <View style={styles.previewFooter}>
              <Text style={styles.previewFooterText}>{t('onboarding.intro2.saveTask')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.dotContainer}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <GradientButton
          title={t('onboarding.intro2.continue')}
          onPress={() => router.push('/onboarding/intro3')}
          accessibilityHint={t('onboardingA11y.intro2ContinueHint')}
        />
        <TouchableOpacity
          onPress={handleSkipIntro}
          style={styles.skipButton}
          disabled={skipLoading}
          accessibilityRole="button"
          accessibilityLabel={t('onboarding.intro2.skip')}
          accessibilityHint={t('onboardingA11y.skipIntroHint')}
          accessibilityState={{ disabled: skipLoading, busy: skipLoading }}
        >
          {skipLoading ? (
            <ActivityIndicator size="small" color={THEME.colors.gradient.blue} />
          ) : (
            <Text style={styles.skipText}>{t('onboarding.intro2.skip')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.fill[100] },
  content: { padding: THEME.spacing.lg, paddingTop: THEME.spacing.xl * 2 },
  iconContainer: { alignItems: 'flex-end', marginBottom: THEME.spacing.xl },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: THEME.colors.fill[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...THEME.typography.h1, color: THEME.colors.text.main, marginBottom: THEME.spacing.xs },
  titleAccent: {
    ...THEME.typography.h1,
    fontFamily: THEME.fonts.accent.italic,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.lg,
  },
  description: { ...THEME.typography.body, color: THEME.colors.text.secondary, lineHeight: 28 },
  dotContainer: { flexDirection: 'row', gap: THEME.spacing.xs, marginTop: THEME.spacing.xl },
  dot: { width: 32, height: 4, borderRadius: 2, backgroundColor: THEME.colors.stroke[100] },
  dotActive: { backgroundColor: THEME.colors.gradient.blue },
  footer: { padding: THEME.spacing.lg, paddingBottom: THEME.spacing.xl },
  skipButton: { marginTop: THEME.spacing.sm, alignItems: 'center', padding: THEME.spacing.sm },
  skipText: { ...THEME.typography.caption, color: THEME.colors.text.secondary },
  previewContainer: { marginTop: THEME.spacing.lg, marginBottom: THEME.spacing.md },
  previewCard: {
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    ...THEME.shadows.soft,
  },
  previewHeader: { marginBottom: THEME.spacing.md },
  previewTitle: { ...THEME.typography.h3, color: THEME.colors.text.main },
  previewInput: {
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.standard,
    padding: THEME.spacing.sm,
    marginBottom: THEME.spacing.md,
    minHeight: 60,
    justifyContent: 'center',
  },
  previewInputText: { ...THEME.typography.body, color: THEME.colors.text.secondary, fontStyle: 'italic' },
  previewExamples: { marginBottom: THEME.spacing.md },
  previewExampleItem: { marginBottom: THEME.spacing.xs },
  previewExampleText: { ...THEME.typography.body, color: THEME.colors.text.main },
  previewFooter: {
    backgroundColor: THEME.colors.gradient.blue,
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.sm,
    alignItems: 'center',
  },
  previewFooterText: {
    ...THEME.typography.body,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
  },
});
