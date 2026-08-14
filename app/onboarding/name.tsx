import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { OnboardingEllieCoach } from '@/components/onboarding/OnboardingEllieCoach';
import { OnboardingScreenShell, onboardingTypography } from '@/components/onboarding/OnboardingScreenShell';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { getDisplayName, normalizeDisplayName } from '@/lib/displayName';
import { ONBOARDING_CAPTURE_ROUTE } from '@/lib/onboardingNavigation';
import { fetchProfilePreferences } from '@/lib/profilePreferences';
import { saveUserDisplayName } from '@/lib/saveDisplayName';
import { track } from '@/lib/analytics';

export default function OnboardingNameScreen() {
  const { t } = useI18n();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [loadingPrefill, setLoadingPrefill] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!user?.id) {
        if (!cancelled) setLoadingPrefill(false);
        return;
      }
      try {
        const { data } = await fetchProfilePreferences(user.id);
        const existing = getDisplayName(
          { full_name: data?.full_name, user_metadata: user.user_metadata },
          '',
        );
        if (!cancelled && existing) setName(existing);
      } finally {
        if (!cancelled) setLoadingPrefill(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.user_metadata]);

  const handleContinue = useCallback(async () => {
    if (!user?.id) {
      router.replace('/auth/login');
      return;
    }

    const normalized = normalizeDisplayName(name);
    if (!normalized) {
      setError(t('onboarding.name.invalid'));
      return;
    }

    setError('');
    setSaving(true);
    const { error: saveError } = await saveUserDisplayName(user.id, user.email, normalized);
    setSaving(false);

    if (saveError) {
      Alert.alert(t('errors.continueFailed'), t('onboarding.name.saveError'));
      return;
    }

    void track('onboarding_name_saved', { next: 'capture' });
    router.push(ONBOARDING_CAPTURE_ROUTE);
  }, [name, t, user?.email, user?.id]);

  const canContinue = Boolean(normalizeDisplayName(name)) && !saving && !loadingPrefill;

  return (
    <OnboardingScreenShell
      footer={
        <CalmPrimaryButton
          label={saving ? t('onboarding.name.saving') : t('onboarding.name.continue')}
          onPress={() => void handleContinue()}
          disabled={!canContinue}
          loading={saving}
          large
          accessibilityHint={t('onboarding.name.continueHint')}
        />
      }
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.avoid}
      >
        <OnboardingEllieCoach message={t('onboarding.ellie.name')} mood="happy" size={72} />
        <Text style={onboardingTypography.title}>{t('onboarding.name.title')}</Text>
        <Text style={onboardingTypography.titleAccent}>{t('onboarding.name.titleAccent')}</Text>
        <Text style={onboardingTypography.subtitle}>{t('onboarding.name.subtitle')}</Text>

        <View style={styles.field}>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (error) setError('');
            }}
            placeholder={t('onboarding.name.placeholder')}
            placeholderTextColor={THEME.colors.text.tertiary}
            autoCapitalize="words"
            autoCorrect={false}
            autoFocus={!loadingPrefill}
            editable={!saving}
            maxLength={40}
            returnKeyType="done"
            onSubmitEditing={() => {
              if (canContinue) void handleContinue();
            }}
            accessibilityLabel={t('onboarding.name.placeholder')}
            accessibilityHint={t('onboarding.name.inputHint')}
          />
          {error ? (
            <Text style={styles.error} accessibilityRole="alert">
              {error}
            </Text>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </OnboardingScreenShell>
  );
}

const styles = StyleSheet.create({
  avoid: {
    flexGrow: 1,
  },
  field: {
    marginTop: THEME.spacing.sm,
    gap: THEME.spacing.xs,
  },
  input: {
    borderWidth: 1.5,
    borderColor: THEME.colors.calm.lavenderDeep,
    borderRadius: THEME.borderRadius.rounded,
    paddingHorizontal: THEME.spacing.md,
    height: THEME.sizes.inputHeight + 8,
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    backgroundColor: THEME.colors.calm.card,
  },
  error: {
    ...THEME.typography.caption,
    color: THEME.colors.semantic.danger,
  },
});
