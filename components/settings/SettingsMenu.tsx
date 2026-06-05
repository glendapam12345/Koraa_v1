import { View, Text, Platform } from 'react-native';
import { useI18n } from '@/contexts/I18nContext';
import type { AppLocale } from '@/lib/i18n';
import { GoogleCalendarConnectSection } from '@/components/settings/GoogleCalendarConnectSection';
import { SettingsLanguageSection } from '@/components/settings/SettingsLanguageSection';
import { SettingsReminderSection } from '@/components/settings/SettingsReminderSection';
import { SettingsHoyPreviewSection } from '@/components/settings/SettingsHoyPreviewSection';
import { SettingsShortcutsMenu } from '@/components/settings/SettingsShortcutsMenu';
import { settingsScreenStyles as styles } from '@/components/settings/settingsScreenStyles';

type SettingsMenuProps = {
  email?: string;
  error: string;
  locale: AppLocale;
  onSelectLocale: (locale: AppLocale) => void;
  reminderTime: { hour: number; minute: number };
  notifSaving: boolean;
  onSelectReminderPreset: (hour: number, minute: number) => void;
  onResetHoyFirstDay: () => void;
  onSimulateHoyDayTwo: () => void;
  resettingHoyPreview: boolean;
  simulatingHoyDayTwo: boolean;
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
  notifSaving,
  onSelectReminderPreset,
  onResetHoyFirstDay,
  onSimulateHoyDayTwo,
  resettingHoyPreview,
  simulatingHoyDayTwo,
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
          saving={notifSaving}
          onSelectPreset={onSelectReminderPreset}
        />
      )}

      <GoogleCalendarConnectSection />

      <SettingsHoyPreviewSection
        onResetFirstDay={onResetHoyFirstDay}
        onSimulateDayTwo={onSimulateHoyDayTwo}
        resetting={resettingHoyPreview}
        simulating={simulatingHoyDayTwo}
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
