import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CalendarDays, Check } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { useGoogleCalendarConnection } from '@/hooks/useGoogleCalendarConnection';
import { GoogleCalendarHowItWorks } from '@/components/tasks/GoogleCalendarHowItWorks';

type GoogleCalendarInlineConnectProps = {
  /** Muestra copy de exportar tras guardar cuando hay fecha. */
  hasScheduledDate?: boolean;
};

export function GoogleCalendarInlineConnect({
  hasScheduledDate = false,
}: GoogleCalendarInlineConnectProps) {
  const { t } = useI18n();
  const router = useRouter();
  const { user } = useAuth();
  const { configured, connected, email, loading, connect } = useGoogleCalendarConnection(user?.id);
  const [busy, setBusy] = useState(false);

  const handleConnect = useCallback(async () => {
    setBusy(true);
    try {
      const result = await connect();
      if (result.ok) {
        Alert.alert(
          t('googleCalendar.connectSuccessTitle'),
          result.email
            ? t('googleCalendar.connectSuccessBodyWithEmail', { email: result.email })
            : t('googleCalendar.captureConnectSuccess'),
        );
        return;
      }
      if (result.reason === 'not_configured') {
        Alert.alert(
          t('googleCalendar.notConfiguredTitle'),
          t('googleCalendar.notConfiguredBody'),
        );
        return;
      }
      if (result.reason === 'cancelled') return;
      Alert.alert(t('googleCalendar.connectErrorTitle'), t('googleCalendar.connectErrorBody'));
    } finally {
      setBusy(false);
    }
  }, [connect, t]);

  if (Platform.OS === 'web') {
    return null;
  }

  const disabled = loading || busy;

  if (connected) {
    return (
      <View
        style={styles.connectedRow}
        accessibilityRole="text"
        accessibilityLabel={t('googleCalendar.captureConnectedA11y', {
          email: email ?? t('googleCalendar.sectionTitle'),
        })}
      >
        <Check size={16} color={THEME.colors.calm.lavenderDeep} />
        <Text style={styles.connectedText}>
          {hasScheduledDate
            ? t('googleCalendar.captureConnectedWithDate')
            : t('googleCalendar.captureConnected')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <CalendarDays size={18} color={THEME.colors.calm.lavenderDeep} />
        <Text style={styles.title}>{t('googleCalendar.captureTitle')}</Text>
      </View>
      <GoogleCalendarHowItWorks />
      <Text style={styles.hint}>
        {configured ? t('googleCalendar.captureHint') : t('googleCalendar.notConfiguredCaptureHint')}
      </Text>
      {configured ? (
        <TouchableOpacity
          style={[styles.btn, disabled && styles.btnDisabled]}
          onPress={() => void handleConnect()}
          disabled={disabled}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t('googleCalendar.captureConnectA11y')}
        >
          {disabled ? (
            <ActivityIndicator size="small" color={THEME.colors.calm.lavenderDeep} />
          ) : (
            <Text style={styles.btnText}>{t('googleCalendar.captureConnectCta')}</Text>
          )}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.btn}
          onPress={() => router.push('/settings')}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t('googleCalendar.openSettingsA11y')}
        >
          <Text style={styles.btnText}>{t('googleCalendar.openSettings')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: THEME.spacing.xs,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.standard,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
  },
  title: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  hint: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  btn: {
    alignSelf: 'flex-start',
    minHeight: 40,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.fill[100],
    borderWidth: 1,
    borderColor: THEME.colors.calm.lavenderDeep,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnText: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
  },
  connectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    paddingVertical: THEME.spacing.xs,
  },
  connectedText: {
    ...THEME.typography.small,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    flex: 1,
    lineHeight: 18,
  },
});
