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
import { ArrowLeft, KeyRound, LogOut, Trash2, Bell, CircleHelp, PenLine, Crown } from 'lucide-react-native';
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

type SettingsStep =
  | 'menu'
  | 'change-password-otp'
  | 'change-password-form'
  | 'delete-account-otp'
  | 'delete-account-confirm';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
        Alert.alert(
          'Permisos de notificación',
          'Activa las notificaciones para Koraa en los ajustes del sistema para recibir el recordatorio de Sentir.',
        );
      }
      await scheduleDailyReminder();
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert(
        'Recordatorio guardado',
        `Te avisaremos sobre las ${formatReminderTime({ hour, minute })} si aún no hiciste check-in ese día.`,
      );
    } catch (e) {
      logger.error('Error guardando recordatorio:', e);
      Alert.alert('No se pudo guardar recordatorio', 'Inténtalo de nuevo.');
    } finally {
      setNotifSaving(false);
    }
  }, []);

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
      'Eliminar cuenta',
      'Esta acción no se puede deshacer. Se borrarán tus datos asociados a Koraa. ¿Seguir?',
      'Sí, continuar',
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
      { destructive: true, cancelText: 'Cancelar' },
    );
  };

  const handleVerifyOtp = async () => {
    const code = otpCode.join('');
    if (code.length !== OTP_CODE_LENGTH) {
      setError(`Introduce el código completo (${OTP_CODE_LENGTH} dígitos)`);
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
    setSuccess('Nuevo código enviado');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError('Completa todos los campos');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (newPassword.length < 8) {
      setError('Mínimo 8 caracteres');
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

    showAlert('Listo', 'Tu contraseña se actualizó correctamente.', [{ text: 'OK', onPress: () => resetState() }]);
  };

  const handleFinalDelete = () => {
    showConfirm(
      'Confirmar eliminación',
      '¿Eliminar tu cuenta de forma permanente?',
      'Eliminar para siempre',
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
      { destructive: true, cancelText: 'Cancelar' },
    );
  };

  const handleSignOut = () => {
    showConfirm(
      'Cerrar sesión',
      '¿Quieres salir de tu cuenta en este dispositivo?',
      'Cerrar sesión',
      () => {
        void (async () => {
          await signOut();
          router.replace('/auth/login');
        })();
      },
      { cancelText: 'Cancelar' },
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
            <Text style={styles.ctaText}>Verificar</Text>
          )}
        </LinearGradient>
      </Pressable>

      <Pressable
        style={styles.resendWrap}
        onPress={handleResendOtp}
        disabled={resendCooldown > 0 || isLoading}
      >
        <Text style={[styles.resendText, (resendCooldown > 0 || isLoading) && styles.resendMuted]}>
          {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : 'Reenviar código'}
        </Text>
      </Pressable>
    </View>
  );

  const renderChangeForm = () => (
    <View style={styles.stepBlock}>
      <Text style={styles.stepTitle}>Nueva contraseña</Text>
      <Text style={styles.stepSubtitle}>Elige una contraseña que no uses en otros sitios</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="Nueva contraseña"
        placeholderTextColor={THEME.colors.text.tertiary}
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        autoCapitalize="none"
        editable={!isLoading}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirmar contraseña"
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
            <Text style={styles.ctaText}>Guardar</Text>
          )}
        </LinearGradient>
      </Pressable>
    </View>
  );

  const renderDeleteConfirm = () => (
    <View style={styles.stepBlock}>
      <Trash2 size={48} color={THEME.colors.semantic.danger} style={styles.centerIcon} />
      <Text style={styles.stepTitle}>Último paso</Text>
      <Text style={styles.stepSubtitle}>
        Tu identidad está verificada. Pulsa el botón para borrar la cuenta de forma permanente.
      </Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Pressable
        style={[styles.dangerOuter, isLoading && styles.ctaDisabled]}
        onPress={handleFinalDelete}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={THEME.colors.onGradient} />
        ) : (
          <Text style={styles.dangerText}>Eliminar mi cuenta</Text>
        )}
      </Pressable>

      <Pressable style={styles.textOnly} onPress={resetState}>
        <Text style={styles.linkMuted}>Cancelar</Text>
      </Pressable>
    </View>
  );

  const renderMenu = () => (
    <View>
      <Text style={styles.section}>Cuenta</Text>
      <Text style={styles.emailMuted}>{user?.email}</Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Text style={styles.section}>Preferencias</Text>
      {Platform.OS === 'web' ? (
        <Text style={styles.notifWebNote}>
          En la versión web no hay recordatorios push. Usa la app en el teléfono para programar el aviso de Sentir.
        </Text>
      ) : (
        <View style={styles.notifSection}>
          <View style={styles.notifSectionHeader}>
            <Bell size={20} color={THEME.colors.gradient.blue} />
            <Text style={styles.notifSectionTitle}>Recordatorio Sentir</Text>
          </View>
          <Text style={styles.notifSectionHint}>
            Hora actual: {formatReminderTime(notifReminderTime)}. Te recordamos hacer check-in si ese día aún no lo hiciste.
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

      <Text style={styles.section}>Accesos</Text>

      <Pressable
        style={styles.row}
        onPress={() => router.push('/paywall')}
        accessibilityRole="button"
        accessibilityLabel="Gestionar Premium"
      >
        <View style={styles.rowLeft}>
          <Crown size={22} color={THEME.colors.text.main} />
          <Text style={styles.rowLabel}>Gestionar Premium</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Pressable
        style={styles.row}
        onPress={() => router.push('/(tabs)/yo?editProfile=1')}
      >
        <View style={styles.rowLeft}>
          <PenLine size={22} color={THEME.colors.text.main} />
          <Text style={styles.rowLabel}>Editar perfil personal</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Pressable style={styles.row} onPress={() => router.push('/help')}>
        <View style={styles.rowLeft}>
          <CircleHelp size={22} color={THEME.colors.text.main} />
          <Text style={styles.rowLabel}>Ayuda</Text>
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
          <Text style={styles.rowLabel}>Cambiar contraseña</Text>
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
          <Text style={styles.rowLabel}>Cerrar sesión</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <View style={styles.divider} />
      <Text style={styles.section}>Zona de riesgo</Text>

      <Pressable
        style={[styles.row, styles.rowDanger]}
        onPress={handleDeleteAccountStart}
        disabled={isLoading && pendingAction === 'delete-account'}
      >
        <View style={styles.rowLeft}>
          <Trash2 size={22} color={THEME.colors.semantic.danger} />
          <Text style={styles.rowLabelDanger}>Eliminar cuenta</Text>
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
        <Text style={styles.topTitle}>Ajustes</Text>
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
          renderOtp('Verificación', 'Introduce el código que enviamos a:')}
        {step === 'change-password-form' && renderChangeForm()}
        {step === 'delete-account-otp' &&
          renderOtp('Verificación', 'Por seguridad, introduce el código enviado a:')}
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
});
