import {
  View,
  Text,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useSettingsScreen } from '@/hooks/useSettingsScreen';
import { SettingsMenu } from '@/components/settings/SettingsMenu';
import { SettingsOtpStep } from '@/components/settings/SettingsOtpStep';
import { SettingsChangePasswordForm } from '@/components/settings/SettingsChangePasswordForm';
import { SettingsDeleteConfirmStep } from '@/components/settings/SettingsDeleteConfirmStep';
import { settingsScreenStyles as styles } from '@/components/settings/settingsScreenStyles';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const settings = useSettingsScreen();

  const {
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
    devPremiumSim,
    handleToggleDevPremiumSim,
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
  } = settings;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.topBar}>
        <Pressable
          onPress={handleBack}
          style={styles.backHit}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={step === 'menu' ? t('settingsA11y.back') : t('settingsA11y.backToMenu')}
        >
          <ArrowLeft size={24} color={THEME.colors.text.main} />
        </Pressable>
        <Text style={styles.topTitle} accessibilityRole="header">
          {t('settings.title')}
        </Text>
        <View style={styles.topRight} />
      </View>

      <ScrollView
        accessibilityLabel={t('settingsA11y.screen')}
        contentContainerStyle={{
          paddingHorizontal: THEME.spacing.md,
          paddingBottom: insets.bottom + THEME.spacing.lg,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {step === 'menu' ? (
          <SettingsMenu
            email={user?.email}
            error={error}
            locale={locale}
            onSelectLocale={(code) => void selectLocale(code)}
            reminderTime={notifReminderTime}
            notifSaving={notifSaving}
            onSelectReminderPreset={(hour, minute) => void applyNotificationPreset(hour, minute)}
            onResetHoyFirstDay={handleResetHoyFirstDay}
            onSimulateHoyDayTwo={handleSimulateHoyDayTwo}
            resettingHoyPreview={resettingHoyPreview}
            simulatingHoyDayTwo={simulatingHoyDayTwo}
            devPremiumSim={devPremiumSim}
            onToggleDevPremiumSim={(enabled) => void handleToggleDevPremiumSim(enabled)}
            userId={user?.id}
            isLoading={isLoading}
            pendingAction={pendingAction}
            onChangePasswordStart={() => void handleChangePasswordStart()}
            onSignOut={handleSignOut}
            onDeleteAccountStart={handleDeleteAccountStart}
          />
        ) : null}

        {step === 'change-password-otp' ? (
          <SettingsOtpStep
            title={t('settingsUi.otpTitle')}
            subtitle={t('settingsUi.otpSubtitlePassword')}
            email={user?.email}
            error={error}
            success={success}
            otpCode={otpCode}
            onOtpChange={setOtpCode}
            isLoading={isLoading}
            resendCooldown={resendCooldown}
            onVerify={() => void handleVerifyOtp()}
            onResend={() => void handleResendOtp()}
            verifyLabel={t('settings.verify')}
            resendLabel={t('settings.resendCode')}
            resendInLabel={t('settings.resendIn', { seconds: resendCooldown })}
          />
        ) : null}

        {step === 'change-password-form' ? (
          <SettingsChangePasswordForm
            title={t('settings.newPasswordTitle')}
            subtitle={t('password.newPasswordSubtitle')}
            error={error}
            newPassword={newPassword}
            confirmPassword={confirmPassword}
            onNewPasswordChange={setNewPassword}
            onConfirmPasswordChange={setConfirmPassword}
            isLoading={isLoading}
            onSave={() => void handleChangePassword()}
            saveLabel={t('settingsUi.save')}
            passwordPlaceholder={t('password.placeholder')}
            confirmPlaceholder={t('password.confirmPlaceholder')}
          />
        ) : null}

        {step === 'delete-account-otp' ? (
          <SettingsOtpStep
            title={t('settingsUi.otpTitle')}
            subtitle={t('settingsUi.otpSubtitleDelete')}
            email={user?.email}
            error={error}
            success={success}
            otpCode={otpCode}
            onOtpChange={setOtpCode}
            isLoading={isLoading}
            resendCooldown={resendCooldown}
            onVerify={() => void handleVerifyOtp()}
            onResend={() => void handleResendOtp()}
            verifyLabel={t('settings.verify')}
            resendLabel={t('settings.resendCode')}
            resendInLabel={t('settings.resendIn', { seconds: resendCooldown })}
          />
        ) : null}

        {step === 'delete-account-confirm' ? (
          <SettingsDeleteConfirmStep
            title={t('settingsUi.deleteLastStepTitle')}
            subtitle={t('settingsUi.deleteLastStepBody')}
            error={error}
            isLoading={isLoading}
            onConfirmDelete={handleFinalDelete}
            onCancel={resetState}
            confirmLabel={t('settingsUi.deleteConfirmCta')}
            cancelLabel={t('common.cancel')}
          />
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
