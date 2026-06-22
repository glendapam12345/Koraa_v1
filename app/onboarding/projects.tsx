import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { FolderOpen } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { OnboardingScreenShell, onboardingTypography } from '@/components/onboarding/OnboardingScreenShell';
import { Toast } from '@/components/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { createProjectForUser } from '@/lib/createProject';
import { PROJECT_COLORS } from '@/lib/projectColors';

const MAX_PROJECTS = 3;

export default function OnboardingProjectsScreen() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const [names, setNames] = useState(['', '', '']);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filledNames = names.map((name) => name.trim()).filter(Boolean);

  const updateName = (index: number, value: string) => {
    setNames((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const goNext = () => {
    router.replace({ pathname: '/paywall', params: { next: '/(tabs)', source: 'onboarding' } });
  };

  const handleContinue = async () => {
    if (!user || filledNames.length === 0) {
      goNext();
      return;
    }

    setIsSaving(true);
    const savedNames: string[] = [];

    try {
      for (let i = 0; i < filledNames.length; i += 1) {
        const result = await createProjectForUser({
          userId: user.id,
          name: filledNames[i],
          color: PROJECT_COLORS[i % PROJECT_COLORS.length],
          existingNames: savedNames,
          locale,
        });
        if (result.ok) savedNames.push(result.project.name);
      }
      goNext();
    } catch {
      setToastMessage(t('onboarding.projects.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <OnboardingScreenShell
        footer={
          <View style={styles.footerStack}>
            <CalmPrimaryButton
              label={isSaving ? t('onboarding.projects.saving') : t('onboarding.projects.continue')}
              onPress={handleContinue}
              disabled={isSaving}
              accessibilityLabel={t('onboarding.projects.continue')}
            />
            <TouchableOpacity
              onPress={goNext}
              disabled={isSaving}
              style={styles.skipButton}
              accessibilityRole="button"
              accessibilityLabel={t('onboarding.projects.skip')}
            >
              <Text style={styles.skipText}>{t('onboarding.projects.skip')}</Text>
            </TouchableOpacity>
          </View>
        }
      >
        <View style={onboardingTypography.iconContainer}>
          <View style={onboardingTypography.iconCircle}>
            <FolderOpen size={32} color={THEME.colors.gradient.blue} />
          </View>
        </View>

        <Text style={onboardingTypography.title}>{t('onboarding.projects.title')}</Text>
        <Text style={onboardingTypography.titleAccent}>{t('onboarding.projects.titleAccent')}</Text>
        <Text style={onboardingTypography.subtitle}>{t('onboarding.projects.subtitle')}</Text>
        <Text style={styles.hint}>{t('onboarding.projects.hint')}</Text>

        <View style={styles.inputs}>
          {names.map((name, index) => (
            <TextInput
              key={`project-${index}`}
              value={name}
              onChangeText={(value) => updateName(index, value)}
              placeholder={t('onboarding.projects.placeholder', { n: index + 1 })}
              placeholderTextColor={THEME.colors.text.secondary}
              style={styles.input}
              maxLength={48}
              autoCorrect={false}
              returnKeyType={index < MAX_PROJECTS - 1 ? 'next' : 'done'}
            />
          ))}
        </View>
      </OnboardingScreenShell>

      {toastMessage ? (
        <Toast message={toastMessage} type="error" onHide={() => setToastMessage(null)} />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  hint: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    marginTop: THEME.spacing.sm,
    marginBottom: THEME.spacing.md,
  },
  inputs: {
    gap: THEME.spacing.sm,
    marginTop: THEME.spacing.sm,
  },
  input: {
    ...THEME.typography.body,
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.fill[200],
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.sm,
    color: THEME.colors.text.main,
    minHeight: THEME.sizes.touchTarget,
  },
  footerStack: {
    gap: THEME.spacing.sm,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: THEME.spacing.xs,
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
  },
  skipText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
  },
});
