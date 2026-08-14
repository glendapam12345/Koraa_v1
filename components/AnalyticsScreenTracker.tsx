import { useEffect } from 'react';
import { AppState } from 'react-native';
import { usePathname } from 'expo-router';
import { trackScreen } from '@/lib/analytics';
import { useAuth } from '@/contexts/AuthContext';
import { maybeTrackReturnedD1 } from '@/lib/retentionD1';

/**
 * Envía screen_view al cambiar la ruta (usuarios autenticados; sin sesión no hace insert).
 * También mide returned_d1 una vez si hoy es el día calendario siguiente al onboarding.
 */
export function AnalyticsScreenTracker() {
  const pathname = usePathname();
  const { user } = useAuth();

  useEffect(() => {
    if (pathname) {
      trackScreen(pathname);
    }
  }, [pathname]);

  useEffect(() => {
    if (!user?.id) return;
    void maybeTrackReturnedD1(user.id);

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void maybeTrackReturnedD1(user.id);
      }
    });
    return () => sub.remove();
  }, [user?.id]);

  return null;
}
