import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<{ error: any }>;
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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (!error && data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        full_name: fullName,
        onboarding_completed: false,
      });

      if (profileError) {
        return { error: profileError };
      }
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Verificar si hay una sesión activa primero
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      if (existingSession) {
        logger.warn('Ya hay una sesión activa. Cerrando sesión antes de iniciar nueva...');
        await supabase.auth.signOut();
        // Pequeña pausa para asegurar que la sesión se cerró
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();
      
      logger.info('Intentando iniciar sesión con email:', trimmedEmail);
      logger.info('Longitud de contraseña:', trimmedPassword.length);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: trimmedPassword,
      });
      
      if (error) {
        logger.error('Error en signIn - Código:', error.status);
        logger.error('Error en signIn - Mensaje:', error.message);
        logger.error('Error completo:', JSON.stringify(error, null, 2));
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
    // En mobile usa deep link, en web usa URL HTTP
    // En Supabase Dashboard → Auth → URL Configuration → Redirect URLs añade:
    // - myapp://reset-password (para iOS/Android)
    // - https://tu-dominio.com/reset-password (para web) o http://localhost:8081/reset-password (desarrollo)
    let redirectTo: string;
    
    if (Platform.OS === 'web') {
      // En web, usar la URL actual de la página + /reset-password
      if (typeof window !== 'undefined') {
        const baseUrl = window.location.origin;
        redirectTo = `${baseUrl}/reset-password`;
      } else {
        // Fallback para desarrollo
        redirectTo = 'http://localhost:8081/reset-password';
      }
    } else {
      // En mobile, usar deep link
      redirectTo = 'myapp://reset-password';
    }
    
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });
    return { error };
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signUp, signIn, signOut, resetPasswordForEmail }}>
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
