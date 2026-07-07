import { View, Text, Platform } from 'react-native';
import { useI18n } from '@/contexts/I18nContext';
import type { AppLocale } from '@/lib/i18n';
import { SettingsLanguageSection } from '@/components/settings/SettingsLanguageSection';
import { AppleHealthConnectSection } from '@/components/settings/AppleHealthConnectSection';
import { SettingsReminderSection } from '@/components/settings/SettingsReminderSection';
import { SettingsCareModeSection } from '@/components/settings/SettingsCareModeSection';
import { SettingsHoyPreviewSection } from '@/components/settings/SettingsHoyPreviewSection';
import { SettingsPremiumDevSection } from '@/components/settings/SettingsPremiumDevSection';
import { SettingsShortcutsMenu } from '@/components/settings/SettingsShortcutsMenu';
import { settingsScreenStyles as styles } from '@/components/settings/settingsScreenStyles';

type SettingsMenuProps = {
  email?: string;
  error: string;
  locale: AppLocale;
  onSelectLocale: (locale: AppLocale) => void;
  reminderTime: { hour: number; minute: number };
  taskCaptureReminderEnabled: boolean;
  notifSaving: boolean;
  onSelectReminderPreset: (hour: number, minute: number) => void;
  onToggleTaskCaptureReminder: (enabled: boolean) => void;
  onResetHoyFirstDay: () => void;
  onSimulateHoyDayTwo: () => void;
  resettingHoyPreview: boolean;
  simulatingHoyDayTwo: boolean;
  devPremiumSim: boolean;
  onToggleDevPremiumSim: (enabled: boolean) => void;
  userId?: string;
  isLoading: boolean;
  pendingAction: 'change-password' | 'delete-account' | null;
  onChangePasswordStart: () => void;
  onSignOut: () => void;
  onDeleteAccountStart: () => void;
};

export function SettingsMenu({
  email,
  error,
  locale,
  onSelectLocale,
  reminderTime,
  taskCaptureReminderEnabled,
  notifSaving,
  onSelectReminderPreset,
  onToggleTaskCaptureReminder,
  onResetHoyFirstDay,
  onSimulateHoyDayTwo,
  resettingHoyPreview,
  simulatingHoyDayTwo,
  devPremiumSim,
  onToggleDevPremiumSim,
  userId,
  isLoading,
  pendingAction,
  onChangePasswordStart,
  onSignOut,
  onDeleteAccountStart,
}: SettingsMenuProps) {
  const { t } = useI18n();

  return (
    <View>
      <Text style={styles.section}>{t('settings.account')}</Text>
      <Text
        style={styles.emailMuted}
        accessibilityRole="text"
        accessibilityLabel={t('settingsA11y.accountEmail', { email: email ?? '' })}
      >
        {email}
      </Text>
      {error ? (
        <Text style={styles.errorText} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}

      <Text style={styles.section}>{t('settings.preferences')}</Text>

      <SettingsLanguageSection locale={locale} onSelectLocale={onSelectLocale} />

      {Platform.OS === 'web' ? (
        <Text style={styles.webNote}>{t('settings.reminderWebNote')}</Text>
      ) : (
        <SettingsReminderSection
          reminderTime={reminderTime}
          taskCaptureReminderEnabled={taskCaptureReminderEnabled}
          saving={notifSaving}
          onSelectPreset={onSelectReminderPreset}
          onToggleTaskCaptureReminder={onToggleTaskCaptureReminder}
        />
      )}

      <AppleHealthConnectSection />

      <SettingsCareModeSection />

      <SettingsHoyPreviewSection
        onResetFirstDay={onResetHoyFirstDay}
        onSimulateDayTwo={onSimulateHoyDayTwo}
        resetting={resettingHoyPreview}
        simulating={simulatingHoyDayTwo}
        disabled={!userId}
      />

      <SettingsPremiumDevSection
        enabled={devPremiumSim}
        onToggle={(next) => void onToggleDevPremiumSim(next)}
        disabled={!userId}
      />

      <SettingsShortcutsMenu
        isLoading={isLoading}
        pendingAction={pendingAction}
        onChangePasswordStart={onChangePasswordStart}
        onSignOut={onSignOut}
        onDeleteAccountStart={onDeleteAccountStart}
      />
    </View>
  );
}
