import { View, Text, Switch, Platform } from 'react-native';
import { Crown } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { settingsScreenStyles as styles } from '@/components/settings/settingsScreenStyles';

type SettingsPremiumDevSectionProps = {
  enabled: boolean;
  onToggle: (next: boolean) => void;
  disabled?: boolean;
};

/** Solo __DEV__: simula Premium para probar candados en Expo Go. */
export function SettingsPremiumDevSection({
  enabled,
  onToggle,
  disabled = false,
}: SettingsPremiumDevSectionProps) {
  const { t } = useI18n();

  if (!__DEV__) return null;

  const handleChange = (next: boolean) => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      void Haptics.selectionAsync();
    }
    onToggle(next);
  };

  return (
    <View>
      <Text style={styles.section}>{t('settings.devPremiumSection')}</Text>
      <Text style={styles.panelSectionHint}>{t('settings.devPremiumHint')}</Text>
      <View
        style={styles.row}
        accessibilityRole="switch"
        accessibilityState={{ checked: enabled, disabled }}
        accessibilityLabel={t('settings.devPremiumToggle')}
        accessibilityHint={t('settings.devPremiumToggleHint')}
      >
        <View style={styles.rowLeft}>
          <Crown size={22} color={THEME.colors.calm.lavenderDeep} />
          <Text style={styles.rowLabel}>{t('settings.devPremiumToggle')}</Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={handleChange}
          disabled={disabled}
          trackColor={{
            false: THEME.colors.fill[200],
            true: THEME.colors.calm.lavender,
          }}
          thumbColor={enabled ? THEME.colors.calm.lavenderDeep : THEME.colors.fill[100]}
        />
      </View>
      {enabled ? (
        <Text style={styles.panelSectionHint}>{t('settings.devPremiumActiveNote')}</Text>
      ) : null}
    </View>
  );
}
