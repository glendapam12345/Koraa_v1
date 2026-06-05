import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { THEME } from '@/constants/theme';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { signInWithEmail } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError(t('auth.login.fillAllFields'));
      return;
    }

    setError('');
    setIsLoading(true);

    const { error: loginError } = await signInWithEmail(email, password);
    setIsLoading(false);

    if (loginError) {
      setError(loginError);
      return;
    }

    router.replace('/');
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + THEME.spacing.md,
            paddingBottom: insets.bottom + THEME.spacing.lg,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t('auth.login.title')}</Text>
          <Text style={styles.subtitle}>{t('auth.login.subtitle')}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>{t('common.email')}</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder={t('auth.login.emailPlaceholder')}
              placeholderTextColor={THEME.colors.text.tertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!isLoading}
              accessibilityLabel={t('authA11y.email')}
              accessibilityHint={t('authA11y.emailHint')}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('common.password')}</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={THEME.colors.text.tertiary}
              secureTextEntry
              autoComplete="password"
              editable={!isLoading}
              accessibilityLabel={t('authA11y.password')}
              accessibilityHint={t('authA11y.passwordHintLogin')}
            />
          </View>

          <Link href="/auth/forgot-password" asChild>
            <TouchableOpacity
              disabled={isLoading}
              style={styles.forgotWrap}
              accessibilityRole="button"
              accessibilityLabel={t('authA11y.forgotPassword')}
              accessibilityHint={t('authA11y.forgotPasswordHint')}
              accessibilityState={{ disabled: isLoading }}
            >
              <Text style={styles.forgot}>{t('auth.login.forgotPassword')}</Text>
            </TouchableOpacity>
          </Link>

          {error ? (
            <Text style={styles.error} accessibilityRole="alert">
              {error}
            </Text>
          ) : null}

          <CalmPrimaryButton
            label={t('auth.login.submit')}
            onPress={handleLogin}
            disabled={isLoading}
            loading={isLoading}
            style={styles.cta}
            accessibilityLabel={isLoading ? t('authA11y.signingIn') : t('authA11y.signIn')}
            accessibilityHint={t('authA11y.signInHint')}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerMuted}>{t('auth.login.noAccount')} </Text>
          <Link href="/auth/signup" asChild>
            <TouchableOpacity
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel={t('authA11y.signUp')}
              accessibilityHint={t('authA11y.signUpHint')}
              accessibilityState={{ disabled: isLoading }}
            >
              <Text style={styles.footerLink}>{t('auth.login.signUp')}</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.colors.fill[100],
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: THEME.spacing.md,
    justifyContent: 'center',
  },
  header: {
    marginBottom: THEME.spacing.lg,
  },
  title: {
    ...THEME.typography.h2,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.xs,
  },
  subtitle: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
  },
  form: {
    gap: THEME.spacing.sm,
  },
  field: {
    gap: 6,
  },
  label: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
  },
  input: {
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.rounded,
    paddingHorizontal: THEME.spacing.sm,
    height: THEME.sizes.inputHeight,
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    backgroundColor: THEME.colors.fill[200],
  },
  forgotWrap: {
    alignSelf: 'flex-end',
    paddingVertical: THEME.spacing.xs,
  },
  forgot: {
    ...THEME.typography.caption,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
  },
  error: {
    ...THEME.typography.caption,
    color: THEME.colors.semantic.danger,
    textAlign: 'center',
  },
  cta: {
    marginTop: THEME.spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: THEME.spacing.lg,
    flexWrap: 'wrap',
  },
  footerMuted: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
  },
  footerLink: {
    ...THEME.typography.caption,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
  },
});
