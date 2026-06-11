import { useCallback, useState } from 'react';
import { Alert, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { CalendarPlus } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { useGoogleCalendarConnection } from '@/hooks/useGoogleCalendarConnection';
import {
  addTaskToGoogleCalendar,
  type AddTaskToGoogleCalendarResult,
} from '@/lib/googleCalendar';

type AddToGoogleCalendarButtonProps = {
  taskId: string;
  title: string;
  scheduledDate: string | null | undefined;
  variant?: 'chip' | 'row';
};

export function AddToGoogleCalendarButton({
  taskId,
  title,
  scheduledDate,
  variant = 'chip',
}: AddToGoogleCalendarButtonProps) {
  const { t } = useI18n();
  const router = useRouter();
  const { user } = useAuth();
  const { configured, connected } = useGoogleCalendarConnection(user?.id);
  const [loading, setLoading] = useState(false);

  const showError = useCallback(
    (result: AddTaskToGoogleCalendarResult) => {
      if (result.ok) return;
      if (result.reason === 'not_connected') {
        Alert.alert(t('googleCalendar.notConnectedTitle'), t('googleCalendar.notConnectedBody'), [
          { text: t('googleCalendar.cancel'), style: 'cancel' },
          { text: t('googleCalendar.goToSettings'), onPress: () => router.push('/settings') },
        ]);
        return;
      }
      if (result.reason === 'already_added') {
        Alert.alert(
          t('googleCalendar.alreadyAddedTitle'),
          t('googleCalendar.alreadyAddedBody'),
          [
            { text: t('googleCalendar.cancel'), style: 'cancel' },
            {
              text: t('googleCalendar.addAgain'),
              onPress: () => {
                void (async () => {
                  if (!user?.id || !scheduledDate) return;
                  setLoading(true);
                  try {
                    const retry = await addTaskToGoogleCalendar(
                      {
                        userId: user.id,
                        taskId,
                        title,
                        scheduledDate,
                        eventNotes: t('googleCalendar.eventNotes'),
                      },
                      { allowDuplicate: true },
                    );
                    if (retry.ok) {
                      Alert.alert(
                        t('googleCalendar.successTitle'),
                        t('googleCalendar.successBody'),
                      );
                    } else {
                      showError(retry);
                    }
                  } finally {
                    setLoading(false);
                  }
                })();
              },
            },
          ],
        );
        return;
      }
      Alert.alert(t('googleCalendar.errorTitle'), t('googleCalendar.errorBody'));
    },
    [router, scheduledDate, t, taskId, title, user?.id],
  );

  const handlePress = useCallback(async () => {
    if (!user?.id || !scheduledDate || loading) return;

    setLoading(true);
    try {
      const result = await addTaskToGoogleCalendar({
        userId: user.id,
        taskId,
        title,
        scheduledDate,
        eventNotes: t('googleCalendar.eventNotes'),
      });

      if (result.ok) {
        Alert.alert(t('googleCalendar.successTitle'), t('googleCalendar.successBody'));
        return;
      }

      showError(result);
    } finally {
      setLoading(false);
    }
  }, [loading, scheduledDate, showError, t, taskId, title, user?.id]);

  if (!configured || !connected || !scheduledDate || !user?.id) {
    return null;
  }

  const label =
    variant === 'row' ? t('googleCalendar.addToCalendar') : t('googleCalendar.addShort');

  return (
    <TouchableOpacity
      style={[styles.button, variant === 'row' && styles.buttonRow]}
      onPress={() => void handlePress()}
      disabled={loading}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={t('googleCalendar.a11y', { task: title.trim() || t('taskCard.taskFallback') })}
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
    ...THEME.typography.body,
    fontSize: 14,
  },
});
