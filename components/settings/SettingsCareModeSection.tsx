import { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { Heart } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { useCrisisMode } from '@/hooks/useCrisisMode';
import { SettingsRow } from '@/components/settings/SettingsRow';
import { settingsScreenStyles as styles } from '@/components/settings/settingsScreenStyles';

export function SettingsCareModeSection() {
  const { t } = useI18n();
  const { crisisModeActive, dismissCrisisMode, loading } = useCrisisMode();
  const [exiting, setExiting] = useState(false);

  if (loading || !crisisModeActive) {
    return null;
  }

  const handleExit = () => {
    void (async () => {
      setExiting(true);
      try {
        await dismissCrisisMode();
        Alert.alert(t('settings.exitCareModeDoneTitle'), t('settings.exitCareModeDoneBody'));
      } finally {
        setExiting(false);
      }
    })();
  };

  return (
    <View>
      <Text style={styles.section}>{t('settings.careModeSection')}</Text>
      <Text style={styles.panelSectionHint}>{t('settings.careModeActiveHint')}</Text>
      <SettingsRow
        icon={<Heart size={22} color={THEME.colors.calm.lavenderDeep} />}
        label={t('settings.exitCareMode')}
        onPress={handleExit}
        loading={exiting}
        accessibilityHint={t('settings.exitCareModeHint')}
      />
    </View>
  );
}
