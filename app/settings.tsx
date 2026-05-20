import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, KeyRound, LogOut, Trash2, Bell, CircleHelp, PenLine, Crown, Globe } from 'lucide-react-native';
import { useI18n } from '@/contexts/I18nContext';
import type { AppLocale } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { OTPInput } from '@/components/auth/OTPInput';
import { showAlert, showConfirm } from '@/lib/crossPlatformAlert';
import { THEME } from '@/constants/theme';
import { OTP_CODE_LENGTH, emptyOtpSlots } from '@/constants/authOtp';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  getDailyReminderTime,
  setDailyReminderTime,
  DAILY_REMINDER_PRESETS,
  formatReminderTime,
} from '@/lib/notificationPreferences';
import { scheduleDailyReminder, checkNotificationPermissions } from '@/hooks/useNotifications';
import { logger } from '@/lib/logger';
import { PasswordRequirementsHint } from '@/components/auth/PasswordRequirementsHint';
import { getPasswordErrorKey } from '@/lib/passwordPolicy';

type SettingsStep =
  | 'menu'
  | 'change-password-otp'
  | 'change-password-form'
  | 'delete-account-otp'
  | 'delete-account-confirm';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, locale, setLocale } = useI18n();
  const { user, signOut, sendReauthOtp, verifyReauthOtp, changePasswordInApp, deleteAccount } = useAuth();

  const [step, setStep] = useState<SettingsStep>('menu');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [otpCode, setOtpCode] = useState(() => emptyOtpSlots());
  const [resendCooldown, setResendCooldown] = useState(0);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [pendingAction, setPendingAction] = useState<'change-password' | 'delete-account' | null>(null);
  const [notifReminderTime, setNotifReminderTime] = useState({ hour: 9, minute: 0 });
  const [notifSaving, setNotifSaving] = useState(false);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    void getDailyReminderTime().then(setNotifReminderTime);
  }, []);

  const applyNotificationPreset = useCallback(async (hour: number, minute: number) => {
    if (Platform.OS === 'web') return;
    setNotifSaving(true);
    try {
      await setDailyReminderTime({ hour, minute });
      setNotifReminderTime({ hour, minute });
      const ok = await checkNotificationPermissions();
      if (!ok) {
        Alert.alert(t('settings.notifPermissionTitle'), t('settings.notifPermissionBody'));
      }
      await scheduleDailyReminder();
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert(
        t('settings.reminderSavedTitle'),
        t('settings.reminderSavedBody', { time: formatReminderTime({ hour, minute }) }),
      );
    } catch (e) {
      logger.error('Error guardando recordatorio:', e);
      Alert.alert(t('settings.reminderSaveError'), t('common.retry'));
    } finally {
      setNotifSaving(false);
    }
  }, [t]);

  const selectLocale = useCallback(
    async (next: AppLocale) => {
      if (next === locale) return;
      await setLocale(next);
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        try {
          const ok = await checkNotificationPermissions();
          if (ok) {
            await scheduleDailyReminder(next);
          }
        } catch (e) {
          logger.debug('Reprogramar recordatorio tras cambio de idioma:', e);
        }
      }
      Alert.alert(t('language.saved'));
    },
    [locale, setLocale, t],
  );

  const resetState = () => {
    setStep('menu');
    setError('');
    setSuccess('');
    setOtpCode(emptyOtpSlots());
    setNewPassword('');
    setConfirmPassword('');
    setPendingAction(null);
  };

  const handleChangePasswordStart = async () => {
    setError('');
    setSuccess('');
    setIsLoading(true);
    setPendingAction('change-password');

    const { error: err } = await sendReauthOtp();
    setIsLoading(false);

    if (err) {
      setError(err);
      setPendingAction(null);
      return;
    }

    setStep('change-password-otp');
    setResendCooldown(60);
  };

  const handleDeleteAccountStart = () => {
    showConfirm(
      t('settings.deleteAccountTitle'),
      t('settings.deleteAccountIntro'),
      t('settings.deleteConfirm'),
      () => {
        void (async () => {
          setError('');
          setSuccess('');
          setIsLoading(true);
          setPendingAction('delete-account');

          const { error: err } = await sendReauthOtp();
          setIsLoading(false);

          if (err) {
            setError(err);
            setPendingAction(null);
            return;
          }

          setStep('delete-account-otp');
          setResendCooldown(60);
        })();
      },
      { destructive: true, cancelText: t('common.cancel'), locale },
    );
  };

  const handleVerifyOtp = async () => {
    const code = otpCode.join('');
    if (code.length !== OTP_CODE_LENGTH) {
      setError(t('settings.otpIncomplete', { length: OTP_CODE_LENGTH }));
      return;
    }

    setError('');
    setIsLoading(true);

    const { error: err } = await verifyReauthOtp(code);
    setIsLoading(false);

    if (err) {
      setError(err);
      setOtpCode(emptyOtpSlots());
      return;
    }

    if (pendingAction === 'change-password') {
      setStep('change-password-form');
    } else if (pendingAction === 'delete-account') {
      setStep('delete-account-confirm');
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    setError('');
    setIsLoading(true);

    const { error: err } = await sendReauthOtp();
    setIsLoading(false);

    if (err) {
      setError(err);
      return;
    }

    setResendCooldown(60);
    setOtpCode(emptyOtpSlots());
    setSuccess(t('settings.otpResent'));
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError(t('auth.signup.fillAllFields'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('password.mismatch'));
      return;
    }
    const passwordErrorKey = getPasswordErrorKey(newPassword);
    if (passwordErrorKey) {
      setError(t(passwordErrorKey));
      return;
    }

    setError('');
    setIsLoading(true);

    const { error: err } = await changePasswordInApp(newPassword);
    setIsLoading(false);

    if (err) {
      setError(err);
      return;
    }

    showAlert(t('settings.passwordUpdatedTitle'), t('settings.passwordUpdatedBody'), [
      { text: t('errors.ok'), onPress: () => resetState() },
    ]);
  };

  const handleFinalDelete = () => {
    showConfirm(
      t('settings.deleteFinalTitle'),
      t('settings.deleteFinalBody'),
      t('settings.deleteForever'),
      () => {
        void (async () => {
          setError('');
          setIsLoading(true);
          const { error: err } = await deleteAccount();
          setIsLoading(false);
          if (err) {
            setError(err);
            return;
          }
          router.replace('/auth/login');
        })();
      },
      { destructive: true, cancelText: t('common.cancel'), locale },
    );
  };

  const handleSignOut = () => {
    showConfirm(
      t('settings.signOutTitle'),
      t('settings.signOutBody'),
      t('settings.signOutTitle'),
      () => {
        void (async () => {
          await signOut();
          router.replace('/auth/login');
        })();
      },
      { cancelText: t('common.cancel'), locale },
    );
  };

  const renderOtp = (title: string, subtitle: string) => (
    <View style={styles.stepBlock}>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepSubtitle}>{subtitle}</Text>
      <Text style={styles.emailBold}>{user?.email}</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {success ? <Text style={styles.successText}>{success}</Text> : null}

      <View style={styles.otpWrap}>
        <OTPInput value={otpCode} onChange={setOtpCode} disabled={isLoading} />
      </View>

      <Pressable
        style={[styles.ctaOuter, isLoading && styles.ctaDisabled]}
        onPress={handleVerifyOtp}
        disabled={isLoading}
      >
        <LinearGradient
          colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.ctaGradient}
        >
          {isLoading ? (
            <ActivityIndicator color={THEME.colors.onGradient} />
          ) : (
            <Text style={styles.ctaText}>{t('settings.verify')}</Text>
          )}
        </LinearGradient>
      </Pressable>

      <Pressable
        style={styles.resendWrap}
        onPress={handleResendOtp}
        disabled={resendCooldown > 0 || isLoading}
      >
        <Text style={[styles.resendText, (resendCooldown > 0 || isLoading) && styles.resendMuted]}>
          {resendCooldown > 0
            ? t('settings.resendIn', { seconds: resendCooldown })
            : t('settings.resendCode')}
        </Text>
      </Pressable>
    </View>
  );

  const renderChangeForm = () => (
    <View style={styles.stepBlock}>
      <Text style={styles.stepTitle}>{t('settings.newPasswordTitle')}</Text>
      <Text style={styles.stepSubtitle}>{t('password.newPasswordSubtitle')}</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder={t('password.placeholder')}
        placeholderTextColor={THEME.colors.text.tertiary}
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        autoCapitalize="none"
        editable={!isLoading}
      />
      <PasswordRequirementsHint />
      <TextInput
        style={styles.input}
        placeholder={t('password.confirmPlaceholder')}
        placeholderTextColor={THEME.colors.text.tertiary}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        autoCapitalize="none"
        editable={!isLoading}
      />

      <Pressable
        style={[styles.ctaOuter, isLoading && styles.ctaDisabled]}
        onPress={handleChangePassword}
        disabled={isLoading}
      >
        <LinearGradient
          colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.ctaGradient}
        >
          {isLoading ? (
            <ActivityIndicator color={THEME.colors.onGradient} />
          ) : (
            <Text style={styles.ctaText}>{t('settingsUi.save')}</Text>
          )}
        </LinearGradient>
      </Pressable>
    </View>
  );

  const renderDeleteConfirm = () => (
    <View style={styles.stepBlock}>
      <Trash2 size={48} color={THEME.colors.semantic.danger} style={styles.centerIcon} />
      <Text style={styles.stepTitle}>{t('settingsUi.deleteLastStepTitle')}</Text>
      <Text style={styles.stepSubtitle}>{t('settingsUi.deleteLastStepBody')}</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Pressable
        style={[styles.dangerOuter, isLoading && styles.ctaDisabled]}
        onPress={handleFinalDelete}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={THEME.colors.onGradient} />
        ) : (
          <Text style={styles.dangerText}>{t('settingsUi.deleteConfirmCta')}</Text>
        )}
      </Pressable>

      <Pressable style={styles.textOnly} onPress={resetState}>
        <Text style={styles.linkMuted}>{t('common.cancel')}</Text>
      </Pressable>
    </View>
  );

  const renderMenu = () => (
    <View>
      <Text style={styles.section}>{t('settings.account')}</Text>
      <Text style={styles.emailMuted}>{user?.email}</Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Text style={styles.section}>{t('settings.preferences')}</Text>

      <View style={styles.languageSection}>
        <View style={styles.notifSectionHeader}>
          <Globe size={20} color={THEME.colors.gradient.blue} />
          <Text style={styles.notifSectionTitle}>{t('language.section')}</Text>
        </View>
        <Text style={styles.notifSectionHint}>{t('language.hint')}</Text>
        <View style={styles.languageChipsWrap}>
          {(['es', 'en'] as const).map((code) => (
            <Pressable
              key={code}
              style={[styles.languageChip, locale === code && styles.languageChipActive]}
              onPress={() => void selectLocale(code)}
              accessibilityRole="button"
              accessibilityState={{ selected: locale === code }}
              accessibilityLabel={code === 'es' ? t('language.spanish') : t('language.english')}
            >
              <Text
                style={[
                  styles.languageChipText,
                  locale === code && styles.languageChipTextActive,
                ]}
              >
                {code === 'es' ? t('language.spanish') : t('language.english')}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {Platform.OS === 'web' ? (
        <Text style={styles.notifWebNote}>{t('settings.reminderWebNote')}</Text>
      ) : (
        <View style={styles.notifSection}>
          <View style={styles.notifSectionHeader}>
            <Bell size={20} color={THEME.colors.gradient.blue} />
            <Text style={styles.notifSectionTitle}>{t('settings.reminderTitle')}</Text>
          </View>
          <Text style={styles.notifSectionHint}>
            {t('settings.reminderHint', { time: formatReminderTime(notifReminderTime) })}
          </Text>
          <View style={styles.notifChipsWrap}>
            {DAILY_REMINDER_PRESETS.map((p) => (
              <Pressable
                key={p.label}
                style={[
                  styles.notifChip,
                  notifReminderTime.hour === p.hour &&
                    notifReminderTime.minute === p.minute &&
                    styles.notifChipActive,
                ]}
                onPress={() => void applyNotificationPreset(p.hour, p.minute)}
                disabled={notifSaving}
              >
                <Text
                  style={[
                    styles.notifChipText,
                    notifReminderTime.hour === p.hour &&
                      notifReminderTime.minute === p.minute &&
                      styles.notifChipTextActive,
                  ]}
                >
                  {p.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <Text style={styles.section}>{t('settings.shortcuts')}</Text>

      <Pressable
        style={styles.row}
        onPress={() => router.push('/paywall')}
        accessibilityRole="button"
        accessibilityLabel={t('settings.managePremium')}
      >
        <View style={styles.rowLeft}>
          <Crown size={22} color={THEME.colors.text.main} />
          <Text style={styles.rowLabel}>{t('settings.managePremium')}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Pressable
        style={styles.row}
        onPress={() => router.push('/(tabs)/yo?editProfile=1')}
      >
        <View style={styles.rowLeft}>
          <PenLine size={22} color={THEME.colors.text.main} />
          <Text style={styles.rowLabel}>{t('settings.editProfile')}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Pressable style={styles.row} onPress={() => router.push('/help')}>
        <View style={styles.rowLeft}>
          <CircleHelp size={22} color={THEME.colors.text.main} />
          <Text style={styles.rowLabel}>{t('settings.help')}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Pressable
        style={styles.row}
        onPress={handleChangePasswordStart}
        disabled={isLoading && pendingAction === 'change-password'}
      >
        <View style={styles.rowLeft}>
          <KeyRound size={22} color={THEME.colors.text.main} />
          <Text style={styles.rowLabel}>{t('settings.changePassword')}</Text>
        </View>
        {isLoading && pendingAction === 'change-password' ? (
          <ActivityIndicator size="small" color={THEME.colors.gradient.blue} />
        ) : (
          <Text style={styles.chevron}>›</Text>
        )}
      </Pressable>

      <Pressable style={styles.row} onPress={handleSignOut}>
        <View style={styles.rowLeft}>
          <LogOut size={22} color={THEME.colors.text.main} />
          <Text style={styles.rowLabel}>{t('settings.signOut')}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <View style={styles.divider} />
      <Text style={styles.section}>{t('settings.riskZone')}</Text>

      <Pressable
        style={[styles.row, styles.rowDanger]}
        onPress={handleDeleteAccountStart}
        disabled={isLoading && pendingAction === 'delete-account'}
      >
        <View style={styles.rowLeft}>
          <Trash2 size={22} color={THEME.colors.semantic.danger} />
          <Text style={styles.rowLabelDanger}>{t('settings.deleteAccount')}</Text>
        </View>
        {isLoading && pendingAction === 'delete-account' ? (
          <ActivityIndicator size="small" color={THEME.colors.semantic.danger} />
        ) : (
          <Text style={styles.chevronDanger}>›</Text>
        )}
      </Pressable>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.topBar}>
        <Pressable
          onPress={() => (step === 'menu' ? router.back() : resetState())}
          style={styles.backHit}
          hitSlop={12}
        >
          <ArrowLeft size={24} color={THEME.colors.text.main} />
        </Pressable>
        <Text style={styles.topTitle}>{t('settings.title')}</Text>
        <View style={styles.topRight} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: THEME.spacing.md,
          paddingBottom: insets.bottom + THEME.spacing.lg,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {step === 'menu' && renderMenu()}
        {step === 'change-password-otp' &&
          renderOtp(t('settingsUi.otpTitle'), t('settingsUi.otpSubtitlePassword'))}
        {step === 'change-password-form' && renderChangeForm()}
        {step === 'delete-account-otp' &&
          renderOtp(t('settingsUi.otpTitle'), t('settingsUi.otpSubtitleDelete'))}
        {step === 'delete-account-confirm' && renderDeleteConfirm()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.colors.fill[100],
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.stroke[100],
  },
  backHit: {
    padding: THEME.spacing.xs,
    width: 44,
  },
  topTitle: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  topRight: {
    width: 44,
  },
  section: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: THEME.spacing.xs,
    marginTop: THEME.spacing.sm,
  },
  emailMuted: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: THEME.spacing.sm + 2,
    paddingHorizontal: THEME.spacing.sm,
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    marginBottom: THEME.spacing.xs,
  },
  rowDanger: {
    backgroundColor: THEME.colors.semantic.dangerSoft,
    borderWidth: 1,
    borderColor: THEME.colors.semantic.dangerBorder,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  rowLabel: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
  },
  rowLabelDanger: {
    ...THEME.typography.body,
    color: THEME.colors.semantic.danger,
    fontFamily: THEME.fonts.heading.bold,
  },
  chevron: {
    ...THEME.typography.h3,
    color: THEME.colors.text.tertiary,
  },
  chevronDanger: {
    ...THEME.typography.h3,
    color: THEME.colors.semantic.danger,
    opacity: 0.7,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.colors.stroke[100],
    marginVertical: THEME.spacing.md,
  },
  stepBlock: {
    paddingTop: THEME.spacing.md,
  },
  stepTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.xs,
  },
  stepSubtitle: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.sm,
  },
  emailBold: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.md,
  },
  centerIcon: {
    alignSelf: 'center',
    marginBottom: THEME.spacing.sm,
  },
  otpWrap: {
    marginBottom: THEME.spacing.md,
  },
  errorText: {
    ...THEME.typography.caption,
    color: THEME.colors.semantic.danger,
    marginBottom: THEME.spacing.sm,
    textAlign: 'center',
  },
  successText: {
    ...THEME.typography.caption,
    color: THEME.colors.semantic.success,
    marginBottom: THEME.spacing.sm,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.rounded,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 14,
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    backgroundColor: THEME.colors.fill[200],
    marginBottom: THEME.spacing.sm,
  },
  ctaOuter: {
    borderRadius: THEME.borderRadius.rounded,
    overflow: 'hidden',
    minHeight: THEME.sizes.buttonHeight,
    marginTop: THEME.spacing.sm,
    ...THEME.shadows.card,
  },
  ctaDisabled: {
    opacity: 0.7,
  },
  ctaGradient: {
    minHeight: THEME.sizes.buttonHeight,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.md,
  },
  ctaText: {
    ...THEME.typography.body,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
  },
  dangerOuter: {
    backgroundColor: THEME.colors.semantic.danger,
    borderRadius: THEME.borderRadius.rounded,
    minHeight: THEME.sizes.buttonHeight,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: THEME.spacing.md,
  },
  dangerText: {
    ...THEME.typography.body,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
  },
  resendWrap: {
    paddingVertical: THEME.spacing.md,
    alignItems: 'center',
  },
  resendText: {
    ...THEME.typography.caption,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
  },
  resendMuted: {
    color: THEME.colors.text.tertiary,
  },
  textOnly: {
    paddingVertical: THEME.spacing.md,
    alignItems: 'center',
  },
  linkMuted: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
  },
  notifWebNote: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.md,
    lineHeight: 20,
  },
  notifSection: {
    marginBottom: THEME.spacing.md,
    paddingBottom: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.stroke[100],
  },
  notifSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.xs,
  },
  notifSectionTitle: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  notifSectionHint: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.sm,
    lineHeight: 20,
  },
  notifChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.xs,
  },
  notifChip: {
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.fill[200],
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
  },
  notifChipActive: {
    backgroundColor: THEME.colors.fill[100],
    borderColor: THEME.colors.gradient.blue,
  },
  notifChipText: {
    ...THEME.typography.small,
    color: THEME.colors.text.main,
  },
  notifChipTextActive: {
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
  },
  languageSection: {
    marginBottom: THEME.spacing.md,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.fill[200],
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
  },
  languageChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.xs,
    marginTop: THEME.spacing.xs,
  },
  languageChip: {
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.fill[100],
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
  },
  languageChipActive: {
    borderColor: THEME.colors.gradient.blue,
    backgroundColor: THEME.colors.fill[100],
  },
  languageChipText: {
    ...THEME.typography.small,
    color: THEME.colors.text.main,
  },
  languageChipTextActive: {
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
  },
});
