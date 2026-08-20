import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as Linking from 'expo-linking';
import {
  supabase,
  canReachSupabase,
  isSupabaseConfigured,
  setCachedAuthUser,
  type SupabaseSession,
  type SupabaseUser,
} from '@/lib/supabase';
import type { AppLocale } from '@/lib/i18n';
import { translate } from '@/lib/i18n';

function authUnreachableMessage(locale: AppLocale, detail?: string): string {
  if (detail === 'missing_config') return translate(locale, 'auth.errors.missingConfig');
  return translate(locale, 'auth.errors.unreachable');
}
import { translateError } from '@/lib/errorMessages';
import { useI18n } from '@/contexts/I18nContext';
import { TimeoutError, withTimeout } from '@/lib/withTimeout';
import { logger } from '@/lib/logger';
import { track } from '@/lib/analytics';
import { clearEllieMiddayState } from '@/lib/ellieMiddayPrompt';
import { clearTabsGateUser } from '@/lib/tabsAuthGateCache';
import { goToLogin } from '@/lib/authNavigation';

export type SignUpResult = {
  error: string | null;
  needsConfirmation: boolean;
};

type AuthContextType = {
  session: SupabaseSession;
  user: SupabaseUser | null;
  loading: boolean;
  isRecoveryMode: boolean;

  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string, fullName?: string) => Promise<SignUpResult>;
  verifySignupOtp: (email: string, token: string) => Promise<{ error: string | null; success: boolean }>;
  resendSignupOtp: (email: string) => Promise<{ error: string | null; success: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null; success: boolean }>;
  verifyRecoveryOtp: (email: string, token: string) => Promise<{ error: string | null; success: boolean }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null; success: boolean }>;
  deleteAccount: () => Promise<{ error: string | null; success: boolean }>;
  sendReauthOtp: () => Promise<{ error: string | null; success: boolean }>;
  verifyReauthOtp: (token: string) => Promise<{ error: string | null; success: boolean }>;
  changePasswordInApp: (newPassword: string) => Promise<{ error: string | null; success: boolean }>;

  /** @deprecated Usar signInWithEmail */
  signIn: (email: string, password: string) => Promise<{ error: unknown }>;
  /** @deprecated Usar signUpWithEmail */
  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ error: unknown; needsEmailConfirmation?: boolean }>;
  /** @deprecated Usar resetPassword sin redirect */
  resetPasswordForEmail: (email: string) => Promise<{ error: unknown; redirectTo?: string | null }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { locale, t } = useI18n();
  const [session, setSession] = useState<SupabaseSession>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  const applySession = useCallback((s: SupabaseSession) => {
    setCachedAuthUser(s?.user ?? null);
    setSession(s);
    setUser(s?.user ?? null);
  }, []);

  const clearSession = useCallback(() => {
    setCachedAuthUser(null);
    setSession(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth
      .getSession()
      .then(async ({ data: { session: s }, error }) => {
        if (error) {
          const msg = error.message?.toLowerCase() ?? '';
          if (msg.includes('refresh token')) {
            logger.warn('Refresh token error; keeping the current session if one exists');
          } else {
            logger.error('Error obteniendo sesión:', error);
          }
          if (s) applySession(s);
          setLoading(false);
          return;
        }
        if (s) applySession(s);
        setLoading(false);
      })
      .catch((error) => {
        logger.error('Error inesperado obteniendo sesión:', error);
        setLoading(false);
      });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, s) => {
      void (async () => {
        try {
          if (event === 'SIGNED_OUT') {
            clearSession();
            clearTabsGateUser();
            goToLogin();
            return;
          }
          if (s) {
            applySession(s);
          }
          if (event === 'PASSWORD_RECOVERY') {
            setIsRecoveryMode(true);
          }
          if (event === 'USER_UPDATED') {
            setIsRecoveryMode(false);
          }
        } catch (error) {
          logger.error('Error en onAuthStateChange:', error);
        }
      })();
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [applySession, clearSession]);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const reach = await canReachSupabase();
      if (!reach.ok) {
        return { error: authUnreachableMessage(locale, reach.detail) };
      }

      const trimmedEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        const isInvalidCreds = (error as { code?: string })?.code === 'invalid_credentials';
        if (isInvalidCreds) {
          logger.warn('Inicio de sesión: credenciales incorrectas');
        } else {
          logger.error('Error en signIn:', error.message);
        }
        return { error: translateError(error, locale) };
      }

      if (data.session) {
        void track('auth_sign_in');
      }

      return { error: null };
    } catch (e) {
      logger.error('Error inesperado en signInWithEmail:', e);
      return { error: translateError(e, locale) };
    }
  };

  const signUpWithEmail = async (email: string, password: string, fullName?: string): Promise<SignUpResult> => {
    try {
      const reach = await canReachSupabase();
      if (!reach.ok) {
        return { error: authUnreachableMessage(locale, reach.detail), needsConfirmation: false };
      }

      const emailNorm = email.trim().toLowerCase();
      const meta =
        fullName !== undefined && fullName.trim().length > 0
          ? { data: { full_name: fullName.trim() } }
          : undefined;

      const { data, error } = await supabase.auth.signUp({
        email: emailNorm,
        password,
        ...(meta ?? {}),
      });

      const userExists = data?.user != null;
      const hasSession = data?.session != null;
      let needsConfirmation = userExists && !hasSession;

      if (userExists && data.user?.identities?.length === 0) {
        return { error: t('auth.errors.emailAlreadyRegistered'), needsConfirmation: false };
      }

      if (error) {
        const errorMessage = error.message.toLowerCase();
        const isRateLimit =
          errorMessage.includes('rate limit') ||
          errorMessage.includes('over_email_send_rate_limit') ||
          (error as { code?: string }).code === 'over_email_send_rate_limit';

        if (isRateLimit) {
          needsConfirmation = true;
          return { error: translateError(error, locale), needsConfirmation: true };
        }

        if (needsConfirmation) {
          return { error: translateError(error, locale), needsConfirmation: true };
        }

        return { error: translateError(error, locale), needsConfirmation: false };
      }

      if (!error && data?.session) {
        void track('auth_sign_up', { email_confirmation_pending: false });
      }

      return { error: null, needsConfirmation };
    } catch (e) {
      return { error: translateError(e, locale), needsConfirmation: false };
    }
  };

  const verifySignupOtp = async (email: string, token: string) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token,
        type: 'signup',
      });

      if (error) return { error: translateError(error, locale), success: false };

      if (data.session) {
        applySession(data.session);
        void track('auth_sign_up', { email_confirmation_pending: false });
        return { error: null, success: true };
      }

      return { error: t('auth.errors.verifyCodeFailed'), success: false };
    } catch (e) {
      return { error: translateError(e, locale), success: false };
    }
  };

  const resendSignupOtp = async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
      });
      if (error) return { error: translateError(error, locale), success: false };
      return { error: null, success: true };
    } catch (e) {
      return { error: translateError(e, locale), success: false };
    }
  };

  const signOut = async () => {
    const userId = user?.id;
    try {
      if (user) void track('auth_sign_out');
      if (userId) void clearEllieMiddayState(userId);
      clearTabsGateUser();
      clearSession();
      setIsRecoveryMode(false);
      goToLogin();
      try {
        await withTimeout(supabase.auth.signOut({ scope: 'local' }), 2500);
      } catch (error) {
        if (!(error instanceof TimeoutError)) {
          logger.warn('Error al cerrar sesión en el cliente:', error);
        }
        try {
          await withTimeout(supabase.auth.signOut(), 2000);
        } catch {
          /* sesión local ya limpia */
        }
      }
    } catch (err) {
      logger.error('Error inesperado al cerrar sesión:', err);
      clearTabsGateUser();
      clearSession();
      setIsRecoveryMode(false);
      goToLogin();
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const reach = await canReachSupabase();
      if (!reach.ok) {
        return { error: authUnreachableMessage(locale, reach.detail), success: false };
      }

      const redirectTo = Linking.createURL('/reset-password');
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo,
      });
      if (error) return { error: translateError(error, locale), success: false };
      return { error: null, success: true };
    } catch (e) {
      return { error: translateError(e, locale), success: false };
    }
  };

  const verifyRecoveryOtp = async (email: string, token: string) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token,
        type: 'recovery',
      });

      if (error) return { error: translateError(error, locale), success: false };

      if (data.session) {
        applySession(data.session);
        setIsRecoveryMode(true);
        return { error: null, success: true };
      }

      return { error: t('auth.errors.verifyCodeFailed'), success: false };
    } catch (e) {
      return { error: translateError(e, locale), success: false };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return {
          error: t('auth.errors.recoverySessionExpired'),
          success: false,
        };
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { error: translateError(error, locale), success: false };
      setIsRecoveryMode(false);
      return { error: null, success: true };
    } catch (e) {
      return { error: translateError(e, locale), success: false };
    }
  };

  const deleteAccount = async () => {
    try {
      if (!user) return { error: t('auth.errors.noActiveSession'), success: false };

      const { error } = await supabase.rpc('delete_user_account');
      if (error) return { error: translateError(error, locale), success: false };

      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch {
        /* sesión ya invalidada al borrar usuario */
      }
      clearSession();
      setIsRecoveryMode(false);
      return { error: null, success: true };
    } catch (e) {
      return { error: translateError(e, locale), success: false };
    }
  };

  const sendReauthOtp = async () => {
    try {
      if (!user?.email) return { error: t('auth.errors.noActiveSession'), success: false };

      const reach = await canReachSupabase();
      if (!reach.ok) {
        return { error: authUnreachableMessage(locale, reach.detail), success: false };
      }

      const { error } = await supabase.auth.signInWithOtp({
        email: user.email.trim().toLowerCase(),
        options: { shouldCreateUser: false },
      });

      if (error) return { error: translateError(error, locale), success: false };
      return { error: null, success: true };
    } catch (e) {
      return { error: translateError(e, locale), success: false };
    }
  };

  const verifyReauthOtp = async (token: string) => {
    try {
      if (!user?.email) return { error: t('auth.errors.noActiveSession'), success: false };

      const { error } = await supabase.auth.verifyOtp({
        email: user.email.trim().toLowerCase(),
        token,
        type: 'email',
      });

      if (error) return { error: translateError(error, locale), success: false };
      return { error: null, success: true };
    } catch (e) {
      return { error: translateError(e, locale), success: false };
    }
  };

  const changePasswordInApp = async (newPassword: string) => {
    try {
      if (!user) return { error: t('auth.errors.noActiveSession'), success: false };

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { error: translateError(error, locale), success: false };
      return { error: null, success: true };
    } catch (e) {
      return { error: translateError(e, locale), success: false };
    }
  };

  const signIn = async (email: string, password: string) => {
    const r = await signInWithEmail(email, password);
    return { error: r.error ? { message: r.error } : null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const r = await signUpWithEmail(email, password, fullName);
    return {
      error: r.error ? { message: r.error } : null,
      needsEmailConfirmation: r.needsConfirmation,
    };
  };

  const resetPasswordForEmail = async (email: string) => {
    const r = await resetPassword(email);
    return { error: r.error ? { message: r.error } : null, redirectTo: null };
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        isRecoveryMode,
        signInWithEmail,
        signUpWithEmail,
        verifySignupOtp,
        resendSignupOtp,
        signOut,
        resetPassword,
        verifyRecoveryOtp,
        updatePassword,
        deleteAccount,
        sendReauthOtp,
        verifyReauthOtp,
        changePasswordInApp,
        signIn,
        signUp,
        resetPasswordForEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
