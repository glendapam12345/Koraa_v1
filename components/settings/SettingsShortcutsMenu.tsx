import { View, Text } from 'react-native';
import {
  Crown,
  PenLine,
  CircleHelp,
  KeyRound,
  LogOut,
  Trash2,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { SettingsRow } from '@/components/settings/SettingsRow';
import { settingsScreenStyles as styles } from '@/components/settings/settingsScreenStyles';
import { openPaywall } from '@/lib/paywallNavigation';

type SettingsShortcutsMenuProps = {
  isLoading: boolean;
  pendingAction: 'change-password' | 'delete-account' | null;
  onChangePasswordStart: () => void;
  onSignOut: () => void;
  onDeleteAccountStart: () => void;
};

export function SettingsShortcutsMenu({
  isLoading,
  pendingAction,
  onChangePasswordStart,
  onSignOut,
  onDeleteAccountStart,
}: SettingsShortcutsMenuProps) {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <View>
      <Text style={styles.section}>{t('settings.shortcuts')}</Text>

      <SettingsRow
        icon={<Crown size={22} color={THEME.colors.text.main} />}
        label={t('settings.managePremium')}
        onPress={() => openPaywall(router, '/settings')}
      />

      <SettingsRow
        icon={<PenLine size={22} color={THEME.colors.text.main} />}
        label={t('settings.editProfile')}
        onPress={() => router.push('/(tabs)/yo')}
      />

      <SettingsRow
        icon={<CircleHelp size={22} color={THEME.colors.text.main} />}
        label={t('settings.help')}
        onPress={() => router.push('/help')}
      />

      <SettingsRow
        icon={<KeyRound size={22} color={THEME.colors.text.main} />}
        label={t('settings.changePassword')}
        onPress={onChangePasswordStart}
        loading={isLoading && pendingAction === 'change-password'}
        disabled={isLoading && pendingAction === 'change-password'}
      />

      <SettingsRow
        icon={<LogOut size={22} color={THEME.colors.text.main} />}
        label={t('settings.signOut')}
        onPress={onSignOut}
      />

      <View style={styles.divider} />
      <Text style={styles.section}>{t('settings.riskZone')}</Text>

      <SettingsRow
        icon={<Trash2 size={22} color={THEME.colors.semantic.danger} />}
        label={t('settings.deleteAccount')}
        onPress={onDeleteAccountStart}
        loading={isLoading && pendingAction === 'delete-account'}
        disabled={isLoading && pendingAction === 'delete-account'}
        danger
      />
    </View>
  );
}
