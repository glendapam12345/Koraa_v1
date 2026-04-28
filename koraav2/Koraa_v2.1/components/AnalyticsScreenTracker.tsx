import { useEffect } from 'react';
import { usePathname } from 'expo-router';
import { trackScreen } from '@/lib/analytics';

/**
 * Envía screen_view al cambiar la ruta (usuarios autenticados; sin sesión no hace insert).
 */
export function AnalyticsScreenTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) {
      trackScreen(pathname);
    }
  }, [pathname]);

  return null;
}
