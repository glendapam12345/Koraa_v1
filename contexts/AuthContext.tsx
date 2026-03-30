import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { createURL } from 'expo-linking';
import { supabase, canReachSupabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ error: any; needsEmailConfirmation?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<{ error: any; redirectTo?: string | null }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar sesión inicial con manejo de errores
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          logger.error('Error obteniendo sesión:', error);
        }
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      })
      .catch((error) => {
        logger.error('Error inesperado obteniendo sesión:', error);
        setSession(null);
        setUser(null);
        setLoading(false);
      });

    // Escuchar cambios de autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        try {
          setSession(session);
          setUser(session?.user ?? null);
        } catch (error) {
          logger.error('Error en onAuthStateChange:', error);
        }
      })();
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const emailNorm = email.trim().toLowerCase();
    // full_name va en user_metadata; la fila en `profiles` la crea el trigger
    // `handle_new_user` en Supabase (migración 20260321120000), no el cliente.
    // Así se evita RLS: sin sesión aún, INSERT desde la app fallaba.
    const { data, error } = await supabase.auth.signUp({
      email: emailNorm,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
        },
      },
    });

    const needsEmailConfirmation = Boolean(data?.user && !data.session);

    return { error, needsEmailConfirmation };
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Cerrar sesión solo en el dispositivo (sin petición de red). Evita "Network request failed"
      // por signOut global antes del login en redes inestables.
      await supabase.auth.signOut({ scope: 'local' });

      const trimmedEmail = email.trim().toLowerCase();
      // No hacer trim() de la contraseña: debe coincidir exactamente con la guardada en Supabase.
      const passwordForSignIn = password;

      logger.info('Intentando iniciar sesión con email:', trimmedEmail);

      // Intentar login
      const reach = await canReachSupabase();
      if (!reach.ok) {
        logger.warn('Supabase no alcanzable:', reach.detail);
        return {
          error: {
            message:
              'No hay conexión con el servidor. Prueba: 1) Cambiar de WiFi a datos móviles (o al revés) 2) Apagar VPN e iCloud Private Relay (Ajustes → Apple ID → iCloud → Private Relay) 3) En Safari abre la URL de tu proyecto Supabase para comprobar red.',
            code: 'network_unreachable',
          },
        };
      }

      logger.info('Enviando petición a Supabase...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: passwordForSignIn,
      });
      
      if (error) {
        const isInvalidCreds = (error as { code?: string })?.code === 'invalid_credentials';
        // Credenciales incorrectas es un caso esperado: no loguear como error para no mostrar overlay rojo
        if (isInvalidCreds) {
          logger.warn('Inicio de sesión: credenciales incorrectas');
        } else {
          logger.error('Error en signIn:', error.message, (error as { code?: string })?.code ?? error.status);
        }
        return { error };
      }
      
      if (data.session) {
        logger.info('Sesión iniciada exitosamente para usuario:', data.user?.id);
        logger.info('Email del usuario:', data.user?.email);
      } else {
        logger.warn('No se obtuvo sesión después de signIn');
      }
      
      return { error: null };
    } catch (err) {
      logger.error('Error inesperado en signIn:', err);
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    try {
      logger.info('Cerrando sesión...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        logger.error('Error al cerrar sesión:', error);
      } else {
        logger.info('Sesión cerrada exitosamente');
        // Limpiar estado local
        setSession(null);
        setUser(null);
      }
    } catch (err) {
      logger.error('Error inesperado al cerrar sesión:', err);
      // Limpiar estado local incluso si hay error
      setSession(null);
      setUser(null);
    }
  };


  const resetPasswordForEmail = async (email: string) => {
    // Expo Go necesita exp://... (createURL), NO myapp:// ni localhost en el móvil.
    // Supabase Dashboard → Authentication → URL Configuration → Redirect URLs debe incluir
    // la URL que ves en consola al pedir el enlace (y http://localhost:8081/** si usas web).
    let redirectTo: string;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      redirectTo = `${window.location.origin}/reset-password`;
    } else {
      redirectTo = createURL('/reset-password');
    }
    if (__DEV__) {
      logger.info(
        'Enlace de recuperación usará redirectTo. Añádelo en Supabase → Auth → URL Configuration → Redirect URLs:',
        redirectTo
      );
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo,
    });
    return { error, redirectTo };
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        signUp,
        signIn,
        signOut,
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
