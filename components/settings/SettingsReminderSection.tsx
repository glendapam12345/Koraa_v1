import { View, Text, Pressable, Switch, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Bell } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import {
  DAILY_REMINDER_PRESETS,
  formatReminderTime,
  deriveTaskCaptureReminderTime,
} from '@/lib/notificationPreferences';
import { settingsScreenStyles as styles } from '@/components/settings/settingsScreenStyles';

type SettingsReminderSectionProps = {
  reminderTime: { hour: number; minute: number };
  taskCaptureReminderEnabled: boolean;
  saving: boolean;
  onSelectPreset: (hour: number, minute: number) => void;
  onToggleTaskCaptureReminder: (enabled: boolean) => void;
};

export function SettingsReminderSection({
  reminderTime,
  taskCaptureReminderEnabled,
  saving,
  onSelectPreset,
  onToggleTaskCaptureReminder,
}: SettingsReminderSectionProps) {
  const { t } = useI18n();
  const captureTime = formatReminderTime(deriveTaskCaptureReminderTime(reminderTime));

  const handleToggle = (next: boolean) => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      void Haptics.selectionAsync();
    }
    onToggleTaskCaptureReminder(next);
  };

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

      <View
        style={[styles.row, styles.reminderToggleRow]}
        accessibilityRole="switch"
        accessibilityState={{ checked: taskCaptureReminderEnabled, disabled: saving }}
        accessibilityLabel={t('settings.taskCaptureReminderToggle')}
        accessibilityHint={t('settings.taskCaptureReminderToggleHint')}
      >
        <View style={styles.toggleRowLeft}>
          <Text style={styles.rowLabel}>{t('settings.taskCaptureReminderToggle')}</Text>
          <Text style={styles.rowSubLabel}>
            {t('settings.taskCaptureReminderToggleHint', { time: captureTime })}
          </Text>
        </View>
        <Switch
          value={taskCaptureReminderEnabled}
          onValueChange={handleToggle}
          disabled={saving}
          trackColor={{
            false: THEME.colors.calm.mist,
            true: THEME.colors.calm.lavender,
          }}
          thumbColor={
            taskCaptureReminderEnabled
              ? THEME.colors.calm.lavenderDeep
              : THEME.colors.calm.card
          }
        />
      </View>
    </View>
  );
}
