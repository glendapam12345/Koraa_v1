import { useCallback, useState } from 'react';
import { Alert, ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { CalendarPlus } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import {
  addTaskToDeviceCalendar,
  isDeviceCalendarSupported,
  promptDeviceCalendarPermission,
  type AddTaskToDeviceCalendarResult,
} from '@/lib/deviceCalendar';

type AddToDeviceCalendarButtonProps = {
  taskId: string;
  title: string;
  scheduledDate: string | null | undefined;
  variant?: 'chip' | 'row';
};

export function AddToDeviceCalendarButton({
  taskId,
  title,
  scheduledDate,
  variant = 'chip',
}: AddToDeviceCalendarButtonProps) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);

  const showError = useCallback(
    (result: AddTaskToDeviceCalendarResult) => {
      if (result.ok) return;

      if (result.reason === 'already_added') {
        Alert.alert(t('deviceCalendar.alreadyAddedTitle'), t('deviceCalendar.alreadyAddedBody'), [
          { text: t('deviceCalendar.cancel'), style: 'cancel' },
          {
            text: t('deviceCalendar.addAgain'),
            onPress: () => {
              void (async () => {
                setLoading(true);
                try {
                  const retry = await addTaskToDeviceCalendar(
                    {
                      taskId,
                      title,
                      scheduledDate: scheduledDate!,
                      eventNotes: t('deviceCalendar.eventNotes'),
                    },
                    { allowDuplicate: true },
                  );
                  if (retry.ok) {
                    Alert.alert(t('deviceCalendar.successTitle'), t('deviceCalendar.successBody'));
                  } else {
                    showError(retry);
                  }
                } finally {
                  setLoading(false);
                }
              })();
            },
          },
        ]);
        return;
      }

      if (result.reason === 'permission_denied') {
        promptDeviceCalendarPermission({
          permissionTitle: t('deviceCalendar.permissionTitle'),
          permissionBody: t('deviceCalendar.permissionBody'),
          cancel: t('deviceCalendar.cancel'),
          openSettings: t('deviceCalendar.openSettings'),
        });
        return;
      }

      if (result.reason === 'native_module_missing') {
        Alert.alert(t('deviceCalendar.unavailableTitle'), t('deviceCalendar.unavailableBody'));
        return;
      }

      Alert.alert(t('deviceCalendar.errorTitle'), t('deviceCalendar.errorBody'));
    },
    [scheduledDate, t, taskId, title],
  );

  const handlePress = useCallback(async () => {
    if (!scheduledDate || loading) return;

    setLoading(true);
    try {
      const result = await addTaskToDeviceCalendar({
        taskId,
        title,
        scheduledDate,
        eventNotes: t('deviceCalendar.eventNotes'),
      });

      if (result.ok) {
        Alert.alert(t('deviceCalendar.successTitle'), t('deviceCalendar.successBody'));
        return;
      }

      showError(result);
    } finally {
      setLoading(false);
    }
  }, [loading, scheduledDate, showError, t, taskId, title]);

  if (Platform.OS === 'web' || !isDeviceCalendarSupported() || !scheduledDate) {
    return null;
  }

  const label =
    variant === 'row' ? t('deviceCalendar.addToCalendar') : t('deviceCalendar.addShort');

  return (
    <TouchableOpacity
      style={[styles.button, variant === 'row' && styles.buttonRow]}
      onPress={() => void handlePress()}
      disabled={loading}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={t('deviceCalendar.a11y', {
        task: title.trim() || t('taskCard.taskFallback'),
      })}
      accessibilityState={{ busy: loading }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={THEME.colors.gradient.blue} />
      ) : (
        <CalendarPlus size={variant === 'row' ? 18 : 12} color={THEME.colors.gradient.blue} />
      )}
      <Text style={[styles.label, variant === 'row' && styles.labelRow]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  buttonRow: {
    gap: THEME.spacing.xs,
    marginTop: THEME.spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    borderRadius: THEME.borderRadius.standard,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
  },
  label: {
    ...THEME.typography.meta,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.medium,
  },
  labelRow: {
    ...THEME.typography.caption,
  },
});
