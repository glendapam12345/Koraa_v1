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
import { CalendarDays } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { useGoogleCalendarConnection } from '@/hooks/useGoogleCalendarConnection';
import { GoogleCalendarHowItWorks } from '@/components/tasks/GoogleCalendarHowItWorks';

export function GoogleCalendarConnectSection() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { configured, connected, email, loading, connect, disconnect } =
    useGoogleCalendarConnection(user?.id);

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
            : t('googleCalendar.connectSuccessBody'),
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

  const handleDisconnect = useCallback(() => {
    Alert.alert(t('googleCalendar.disconnectTitle'), t('googleCalendar.disconnectBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('googleCalendar.disconnectConfirm'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setBusy(true);
            try {
              await disconnect();
            } finally {
              setBusy(false);
            }
          })();
        },
      },
    ]);
  }, [disconnect, t]);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.section}>
        <View style={styles.header}>
          <CalendarDays size={20} color={THEME.colors.gradient.blue} />
          <Text style={styles.title}>{t('googleCalendar.sectionTitle')}</Text>
        </View>
        <Text style={styles.hint}>{t('googleCalendar.webNote')}</Text>
      </View>
    );
  }

  if (!configured) {
    return (
      <View style={styles.section}>
        <View style={styles.header}>
          <CalendarDays size={20} color={THEME.colors.gradient.blue} />
          <Text style={styles.title}>{t('googleCalendar.sectionTitle')}</Text>
        </View>
        <GoogleCalendarHowItWorks />
        <Text style={[styles.hint, styles.hintSpaced]}>{t('googleCalendar.notConfiguredHint')}</Text>
      </View>
    );
  }

  const disabled = loading || busy;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <CalendarDays size={20} color={THEME.colors.gradient.blue} />
        <Text style={styles.title}>{t('googleCalendar.sectionTitle')}</Text>
      </View>
      {!connected ? <GoogleCalendarHowItWorks /> : null}
      <Text style={[styles.hint, !connected && styles.hintSpaced]}>
        {connected && email
          ? t('googleCalendar.connectedHint', { email })
          : t('googleCalendar.disconnectedHint')}
      </Text>

      <TouchableOpacity
        style={[styles.btn, connected && styles.btnConnected, disabled && styles.btnDisabled]}
        onPress={connected ? handleDisconnect : () => void handleConnect()}
        disabled={disabled}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={
          connected ? t('googleCalendar.disconnectA11y') : t('googleCalendar.connectA11y')
        }
      >
        {disabled ? (
          <ActivityIndicator size="small" color={THEME.colors.gradient.blue} />
        ) : (
          <Text style={[styles.btnText, connected && styles.btnTextConnected]}>
            {connected ? t('googleCalendar.disconnect') : t('googleCalendar.connect')}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: THEME.spacing.md,
    padding: THEME.spacing.md,
    backgroundColor: THEME.colors.calm.card,
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.xs,
  },
  title: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  hint: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
    marginBottom: THEME.spacing.sm,
  },
  hintSpaced: {
    marginTop: THEME.spacing.xs,
  },
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: THEME.sizes.touchTarget,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.gradient.blue,
    paddingHorizontal: THEME.spacing.md,
  },
  btnConnected: {
    backgroundColor: THEME.colors.calm.mist,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnText: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.onGradient,
  },
  btnTextConnected: {
    color: THEME.colors.text.main,
  },
});
