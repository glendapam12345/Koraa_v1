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
import { Moon } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { useAppleHealthConnection } from '@/hooks/useAppleHealthConnection';

export function AppleHealthConnectSection() {
  const { t } = useI18n();
  const {
    available,
    connected,
    loading,
    lastNightHours,
    healthKitAvailable,
    sleepLoading,
    connect,
    disconnect,
    openSleep,
    refreshSleep,
  } = useAppleHealthConnection(t);
  const [busy, setBusy] = useState(false);

  const handleConnect = useCallback(async () => {
    setBusy(true);
    try {
      const result = await connect();
      if (result.ok) {
        const body = result.healthKit
          ? t('appleHealth.connectSuccessBodyHealthKit')
          : t('appleHealth.connectSuccessBody');
        Alert.alert(t('appleHealth.connectSuccessTitle'), body);
        return;
      }
      if (result.reason === 'unavailable') {
        Alert.alert(t('appleHealth.unavailableTitle'), t('appleHealth.unavailableBody'));
        return;
      }
      if (result.reason === 'permission_denied') {
        Alert.alert(
          t('appleHealth.permissionDeniedTitle'),
          t('appleHealth.permissionDeniedBody'),
        );
        return;
      }
      Alert.alert(t('appleHealth.connectErrorTitle'), t('appleHealth.connectErrorBody'));
    } finally {
      setBusy(false);
    }
  }, [connect, t]);

  const handleDisconnect = useCallback(() => {
    Alert.alert(t('appleHealth.disconnectTitle'), t('appleHealth.disconnectBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('appleHealth.disconnectConfirm'),
        style: 'destructive',
        onPress: () => {
          void disconnect();
        },
      },
    ]);
  }, [disconnect, t]);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.section}>
        <View style={styles.header}>
          <Moon size={20} color={THEME.colors.gradient.blue} />
          <Text style={styles.title}>{t('appleHealth.sectionTitle')}</Text>
        </View>
        <Text style={styles.hint}>{t('appleHealth.webNote')}</Text>
      </View>
    );
  }

  if (!available) {
    return (
      <View style={styles.section}>
        <View style={styles.header}>
          <Moon size={20} color={THEME.colors.gradient.blue} />
          <Text style={styles.title}>{t('appleHealth.sectionTitle')}</Text>
        </View>
        <Text style={styles.hint}>{t('appleHealth.androidNote')}</Text>
      </View>
    );
  }

  const disabled = loading || busy;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Moon size={20} color={THEME.colors.gradient.blue} />
        <Text style={styles.title}>{t('appleHealth.sectionTitle')}</Text>
      </View>
      <Text style={styles.hint}>
        {connected && lastNightHours != null
          ? t('appleHealth.connectedWithSleepHint', { hours: lastNightHours })
          : connected
            ? healthKitAvailable
              ? t('appleHealth.connectedNoDataHint')
              : t('appleHealth.connectedHint')
            : t('appleHealth.disconnectedHint')}
      </Text>

      {healthKitAvailable ? (
        <Text style={styles.meta}>
          {sleepLoading ? t('appleHealth.sleepLoading') : t('appleHealth.healthKitNote')}
        </Text>
      ) : (
        <Text style={styles.meta}>{t('appleHealth.expoGoNote')}</Text>
      )}

      <TouchableOpacity
        style={[styles.btn, connected && styles.btnConnected, disabled && styles.btnDisabled]}
        onPress={connected ? handleDisconnect : () => void handleConnect()}
        disabled={disabled}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={
          connected ? t('appleHealth.disconnectA11y') : t('appleHealth.connectA11y')
        }
      >
        {disabled ? (
          <ActivityIndicator size="small" color={THEME.colors.gradient.blue} />
        ) : (
          <Text style={[styles.btnText, connected && styles.btnTextConnected]}>
            {connected ? t('appleHealth.disconnect') : t('appleHealth.connect')}
          </Text>
        )}
      </TouchableOpacity>

      {connected && healthKitAvailable ? (
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => void refreshSleep()}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t('appleHealth.refreshSleepA11y')}
        >
          <Text style={styles.secondaryBtnText}>{t('appleHealth.refreshSleep')}</Text>
        </TouchableOpacity>
      ) : null}

      {connected ? (
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => void openSleep()}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t('appleHealth.openSleepA11y')}
        >
          <Text style={styles.secondaryBtnText}>{t('appleHealth.openSleep')}</Text>
        </TouchableOpacity>
      ) : null}
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
    marginBottom: THEME.spacing.xs,
  },
  meta: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
    marginBottom: THEME.spacing.sm,
    opacity: 0.9,
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
  secondaryBtn: {
    marginTop: THEME.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: THEME.sizes.touchTarget,
    paddingHorizontal: THEME.spacing.md,
  },
  secondaryBtnText: {
    ...THEME.typography.body,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.medium,
  },
});
