import { useState, useEffect, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import type { AppLocale } from '@/lib/i18n';
import { showAlert, showConfirm } from '@/lib/crossPlatformAlert';
import { OTP_CODE_LENGTH, emptyOtpSlots } from '@/constants/authOtp';
import {
  getDailyReminderTime,
  setDailyReminderTime,
  formatReminderTime,
} from '@/lib/notificationPreferences';
import { scheduleDailyReminder, checkNotificationPermissions } from '@/hooks/useNotifications';
import { logger } from '@/lib/logger';
import { getPasswordErrorKey } from '@/lib/passwordPolicy';
import { resetHoyFirstDayPreview, simulateHoyDayTwo } from '@/lib/hoyLiteDay';

export type SettingsStep =
  | 'menu'
  | 'change-password-otp'
  | 'change-password-form'
  | 'delete-account-otp'
  | 'delete-account-confirm';

export function useSettingsScreen() {
  const router = useRouter();
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
  const [resettingHoyPreview, setResettingHoyPreview] = useState(false);
  const [simulatingHoyDayTwo, setSimulatingHoyDayTwo] = useState(false);

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

  const resetState = useCallback(() => {
    setStep('menu');
    setError('');
    setSuccess('');
    setOtpCode(emptyOtpSlots());
    setNewPassword('');
    setConfirmPassword('');
    setPendingAction(null);
  }, []);

  const applyNotificationPreset = useCallback(
    async (hour: number, minute: number) => {
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
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
    },
    [t],
  );

  const handleResetHoyFirstDay = useCallback(() => {
    if (!user?.id) return;
    Alert.alert(t('settings.resetHoyFirstDayConfirmTitle'), t('settings.resetHoyFirstDayConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.resetHoyFirstDay'),
        onPress: () => {
          void (async () => {
            setResettingHoyPreview(true);
            try {
              await resetHoyFirstDayPreview(user.id);
              if (Platform.OS === 'ios' || Platform.OS === 'android') {
                void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
              Alert.alert(t('settings.resetHoyFirstDayDoneTitle'), t('settings.resetHoyFirstDayDoneBody'), [
                { text: t('errors.ok'), onPress: () => router.replace('/(tabs)') },
              ]);
            } catch (e) {
              logger.error('Error reiniciando vista primer día Hoy:', e);
              Alert.alert(t('errors.generic'), t('common.retry'));
            } finally {
              setResettingHoyPreview(false);
            }
          })();
        },
      },
    ]);
  }, [router, t, user?.id]);

  const handleSimulateHoyDayTwo = useCallback(() => {
    if (!user?.id) return;
    Alert.alert(t('settings.simulateHoyDayTwoConfirmTitle'), t('settings.simulateHoyDayTwoConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.simulateHoyDayTwo'),
        onPress: () => {
          void (async () => {
            setSimulatingHoyDayTwo(true);
            try {
              await simulateHoyDayTwo(user.id);
              if (Platform.OS === 'ios' || Platform.OS === 'android') {
                void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
              Alert.alert(t('settings.simulateHoyDayTwoDoneTitle'), t('settings.simulateHoyDayTwoDoneBody'), [
                { text: t('errors.ok'), onPress: () => router.replace('/(tabs)') },
              ]);
            } catch (e) {
              logger.error('Error simulando día 2 en Hoy:', e);
              Alert.alert(t('errors.generic'), t('common.retry'));
            } finally {
              setSimulatingHoyDayTwo(false);
            }
          })();
        },
      },
    ]);
  }, [router, t, user?.id]);

  const selectLocale = useCallback(
    async (next: AppLocale) => {
      if (next === locale) return;
      await setLocale(next);
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        try {
          const ok = await checkNotificationPermissions();
          if (ok) await scheduleDailyReminder(next);
        } catch (e) {
          logger.debug('Reprogramar recordatorio tras cambio de idioma:', e);
        }
      }
      Alert.alert(t('language.saved'));
    },
    [locale, setLocale, t],
  );

  const handleChangePasswordStart = useCallback(async () => {
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
  }, [sendReauthOtp]);

  const handleDeleteAccountStart = useCallback(() => {
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
  }, [locale, sendReauthOtp, t]);

  const handleVerifyOtp = useCallback(async () => {
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
    if (pendingAction === 'change-password') setStep('change-password-form');
    else if (pendingAction === 'delete-account') setStep('delete-account-confirm');
  }, [otpCode, pendingAction, t, verifyReauthOtp]);

  const handleResendOtp = useCallback(async () => {
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
  }, [resendCooldown, sendReauthOtp, t]);

  const handleChangePassword = useCallback(async () => {
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
  }, [changePasswordInApp, confirmPassword, newPassword, resetState, t]);

  const handleFinalDelete = useCallback(() => {
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
  }, [deleteAccount, locale, router, t]);

  const handleSignOut = useCallback(() => {
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
  }, [locale, router, signOut, t]);

  const handleBack = useCallback(() => {
    if (step === 'menu') router.back();
    else resetState();
  }, [resetState, router, step]);

  return {
    t,
    locale,
    user,
    step,
    isLoading,
    error,
    success,
    otpCode,
    setOtpCode,
    resendCooldown,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    pendingAction,
    notifReminderTime,
    notifSaving,
    resettingHoyPreview,
    simulatingHoyDayTwo,
    resetState,
    applyNotificationPreset,
    handleResetHoyFirstDay,
    handleSimulateHoyDayTwo,
    selectLocale,
    handleChangePasswordStart,
    handleDeleteAccountStart,
    handleVerifyOtp,
    handleResendOtp,
    handleChangePassword,
    handleFinalDelete,
    handleSignOut,
    handleBack,
  };
}
