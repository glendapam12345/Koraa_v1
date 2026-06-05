import { View, Text, Pressable } from 'react-native';
import { Bell } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { DAILY_REMINDER_PRESETS, formatReminderTime } from '@/lib/notificationPreferences';
import { settingsScreenStyles as styles } from '@/components/settings/settingsScreenStyles';

type SettingsReminderSectionProps = {
  reminderTime: { hour: number; minute: number };
  saving: boolean;
  onSelectPreset: (hour: number, minute: number) => void;
};

export function SettingsReminderSection({
  reminderTime,
  saving,
  onSelectPreset,
}: SettingsReminderSectionProps) {
  const { t } = useI18n();

  return (
    <View style={styles.panelSection}>
      <View style={styles.panelSectionHeader}>
        <Bell size={20} color={THEME.colors.calm.lavenderDeep} />
        <Text style={styles.panelSectionTitle}>{t('settings.reminderTitle')}</Text>
      </View>
      <Text style={styles.panelSectionHint}>
        {t('settings.reminderHint', { time: formatReminderTime(reminderTime) })}
      </Text>
      <View style={styles.chipsWrap}>
        {DAILY_REMINDER_PRESETS.map((preset) => {
          const isActive =
            reminderTime.hour === preset.hour && reminderTime.minute === preset.minute;
          return (
            <Pressable
              key={preset.label}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => onSelectPreset(preset.hour, preset.minute)}
              disabled={saving}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive, disabled: saving }}
              accessibilityLabel={t('settingsA11y.reminderPreset', { time: preset.label })}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{preset.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
