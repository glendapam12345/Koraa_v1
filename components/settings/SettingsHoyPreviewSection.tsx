import { View, Text } from 'react-native';
import { RotateCcw } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { SettingsRow } from '@/components/settings/SettingsRow';
import { settingsScreenStyles as styles } from '@/components/settings/settingsScreenStyles';

type SettingsHoyPreviewSectionProps = {
  onResetFirstDay: () => void;
  onSimulateDayTwo: () => void;
  resetting: boolean;
  simulating: boolean;
  disabled: boolean;
};

export function SettingsHoyPreviewSection({
  onResetFirstDay,
  onSimulateDayTwo,
  resetting,
  simulating,
  disabled,
}: SettingsHoyPreviewSectionProps) {
  const { t } = useI18n();

  return (
    <View>
      <Text style={styles.section}>{t('settings.hoyFirstDaySection')}</Text>
      <Text style={styles.panelSectionHint}>{t('settings.resetHoyFirstDayHint')}</Text>
      <SettingsRow
        icon={<RotateCcw size={22} color={THEME.colors.text.main} />}
        label={t('settings.resetHoyFirstDay')}
        onPress={onResetFirstDay}
        loading={resetting}
        disabled={disabled}
        accessibilityHint={t('settings.resetHoyFirstDayHint')}
      />
      <SettingsRow
        icon={<RotateCcw size={22} color={THEME.colors.calm.lavenderDeep} />}
        label={t('settings.simulateHoyDayTwo')}
        onPress={onSimulateDayTwo}
        loading={simulating}
        disabled={disabled}
        accessibilityHint={t('settings.simulateHoyDayTwoHint')}
      />
    </View>
  );
}
