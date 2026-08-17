import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { OnboardingEllieCoach } from '@/components/onboarding/OnboardingEllieCoach';
import { OnboardingScreenShell, onboardingTypography } from '@/components/onboarding/OnboardingScreenShell';
import { OnboardingActivitiesSkipLink } from '@/components/onboarding/OnboardingActivitiesForm';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { goToHoyAfterOnboarding } from '@/lib/onboardingNavigation';
import {
  DAILY_REMINDER_PRESETS,
  formatReminderTime,
  setDailyReminderOptedIn,
  setDailyReminderTime,
} from '@/lib/notificationPreferences';
import {
  requestNotificationPermission,
  scheduleDailyReminder,
  ensureReturnTomorrowReminder,
} from '@/hooks/useNotifications';
import { markReturnTomorrowToast } from '@/lib/returnTomorrowToast';
import { track } from '@/lib/analytics';

export default function OnboardingRemindersScreen() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [saving, setSaving] = useState(false);

  const finishToHoy = async () => {
    if (!user?.id) {
      router.replace('/auth/login');
      return;
    }
    await goToHoyAfterOnboarding(user.id);
  };

  const acceptReminders = async () => {
    if (!user?.id || saving) return;
    setSaving(true);
    try {
      await setDailyReminderTime({ hour, minute });
      await setDailyReminderOptedIn(true);
      const granted = await requestNotificationPermission();
      if (!granted && Platform.OS !== 'web') {
        Alert.alert(t('settings.notifPermissionTitle'), t('settings.notifPermissionBody'));
      }
      await ensureReturnTomorrowReminder();
      await markReturnTomorrowToast(formatReminderTime({ hour, minute }));
      void track('onboarding_reminders_choice', { opted_in: true, hour, minute });
      await finishToHoy();
    } catch {
      setSaving(false);
    }
  };

  const skipReminders = async () => {
    if (!user?.id || saving) return;
    setSaving(true);
    try {
      await setDailyReminderOptedIn(false);
      await scheduleDailyReminder();
      void track('onboarding_reminders_choice', { opted_in: false });
      await finishToHoy();
    } catch {
      setSaving(false);
    }
  };

  return (
    <OnboardingScreenShell
      footer={
        <View style={styles.footerCol}>
          <CalmPrimaryButton
            label={t('onboarding.reminders.accept')}
            onPress={() => void acceptReminders()}
            disabled={saving}
            loading={saving}
            large
            accessibilityHint={t('onboardingA11y.remindersAcceptHint')}
          />
          <OnboardingActivitiesSkipLink
            label={t('onboarding.reminders.skip')}
            onPress={() => void skipReminders()}
            disabled={saving}
          />
        </View>
      }
    >
      <OnboardingEllieCoach message={t('onboarding.ellie.reminders')} mood="grateful" size={52} />
      <Text style={onboardingTypography.title}>{t('onboarding.reminders.title')}</Text>
      <Text style={onboardingTypography.titleAccent}>{t('onboarding.reminders.titleAccent')}</Text>
      <Text style={onboardingTypography.subtitle}>{t('onboarding.reminders.subtitle')}</Text>

      <View
        style={styles.chipsRow}
        accessibilityRole="radiogroup"
        accessibilityLabel={t('onboarding.reminders.timeGroupA11y')}
      >
        {DAILY_REMINDER_PRESETS.map((preset) => {
          const active = hour === preset.hour && minute === preset.minute;
          return (
            <Pressable
              key={preset.label}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => {
                setHour(preset.hour);
                setMinute(preset.minute);
              }}
              disabled={saving}
              accessibilityRole="radio"
              accessibilityState={{ selected: active, disabled: saving }}
              accessibilityLabel={preset.label}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{preset.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </OnboardingScreenShell>
  );
}

const styles = StyleSheet.create({
  footerCol: {
    gap: THEME.spacing.xs,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.xs,
    marginTop: THEME.spacing.xs,
  },
  chip: {
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.mist,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: THEME.colors.calm.lavender,
    borderColor: THEME.colors.calm.lavenderDeep,
  },
  chipText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
  },
  chipTextActive: {
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
});
