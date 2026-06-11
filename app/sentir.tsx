import { useCallback } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { CHECK_IN_ROUTE } from '@/lib/checkInNavigation';
import { supabase } from '@/lib/supabase';
import { getLocalDateString } from '@/lib/dateLocal';
import { AppLoadingGate } from '@/components/AppLoadingGate';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';

async function hasTodayCheckIn(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('daily_check_ins')
    .select('emotion')
    .eq('user_id', userId)
    .eq('date', getLocalDateString())
    .maybeSingle();
  return Boolean(data?.emotion);
}

/**
 * Ruta legacy / deep link: redirige a Hoy.
 * - Con check-in hoy → Hoy + modal de recheck.
 * - Sin check-in → Hoy (check-in embebido en inicio).
 */
export default function SentirScreen() {
  const { t } = useI18n();
  const { user } = useAuth();

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) {
        router.replace('/auth/login');
        return;
      }

      let cancelled = false;
      void (async () => {
        const checkedIn = await hasTodayCheckIn(user.id);
        if (cancelled) return;

        if (checkedIn) {
          router.replace({
            pathname: CHECK_IN_ROUTE,
            params: { openRecheck: '1', recheckSource: 'sentir' },
          });
          return;
        }

        router.replace(CHECK_IN_ROUTE);
      })();

      return () => {
        cancelled = true;
      };
    }, [user?.id]),
  );

  return <AppLoadingGate message={t('sentir.redirecting')} />;
}
