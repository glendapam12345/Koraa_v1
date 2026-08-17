import { useState, useCallback, type RefObject } from 'react';
import { Alert, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { supabase, getCachedAuthUser } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { getLocalDateString } from '@/lib/dateLocal';
import { useI18n } from '@/contexts/I18nContext';

type ToastFn = (message: string, type?: 'success' | 'error' | 'info') => void;

type UseHoyMeditationArgs = {
  showToast: ToastFn;
  setShowConfetti: (show: boolean) => void;
  confettiTimeoutRef: RefObject<ReturnType<typeof setTimeout> | null>;
};

export function useHoyMeditation({
  showToast,
  setShowConfetti,
  confettiTimeoutRef,
}: UseHoyMeditationArgs) {
  const { t } = useI18n();
  const [showMeditation, setShowMeditation] = useState(false);
  const [meditationType, setMeditationType] = useState<'morning' | 'evening'>('morning');
  const [morningMeditationDone, setMorningMeditationDone] = useState(false);
  const [eveningMeditationDone, setEveningMeditationDone] = useState(false);

  const loadMeditations = useCallback(async () => {
    try {
      const user = await getCachedAuthUser();
      if (!user) return;

      const today = getLocalDateString();
      const { data: meditations } = await supabase
        .from('meditations')
        .select('type')
        .eq('user_id', user.id)
        .eq('date', today);

      if (meditations) {
        setMorningMeditationDone(meditations.some((m: { type: string }) => m.type === 'morning'));
        setEveningMeditationDone(meditations.some((m: { type: string }) => m.type === 'evening'));
      }
    } catch (error) {
      logger.debug('Error cargando meditaciones:', error);
    }
  }, []);

  const handleMeditationComplete = useCallback(async () => {
    try {
      const user = await getCachedAuthUser();
      if (!user) return;

      const today = getLocalDateString();
      const { error } = await supabase
        .from('meditations')
        .upsert(
          {
            user_id: user.id,
            date: today,
            type: meditationType,
          },
          { onConflict: 'user_id,date,type' },
        );

      if (error) {
        logger.error('Error guardando meditación:', error);
        const code = (error as { code?: string }).code;
        const msg = (error as { message?: string }).message ?? '';
        if (code === 'PGRST205' || msg.includes('meditations')) {
          Alert.alert(
            t('hoy.meditationPrepTitle'),
            t('hoy.meditationPrepBody'),
            [{ text: t('errors.understood') }],
          );
          return;
        }
        showToast(t('errors.saveMeditationFailed'), 'error');
        return;
      }

      if (meditationType === 'morning') {
        setMorningMeditationDone(true);
      } else {
        setEveningMeditationDone(true);
      }

      setShowMeditation(false);
      setShowConfetti(true);
      showToast(t('hoy.meditationDoneToast'), 'success');

      if (Platform.OS !== 'web') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      if (confettiTimeoutRef.current) {
        clearTimeout(confettiTimeoutRef.current);
      }
      confettiTimeoutRef.current = setTimeout(() => {
        setShowConfetti(false);
        confettiTimeoutRef.current = null;
      }, 3000);
    } catch (error) {
      logger.error('Error inesperado en meditación:', error);
      showToast(t('errors.generic'), 'error');
    }
  }, [confettiTimeoutRef, meditationType, setShowConfetti, showToast, t]);

  const handleStartMeditation = useCallback((type: 'morning' | 'evening') => {
    setMeditationType(type);
    setShowMeditation(true);
  }, []);

  return {
    showMeditation,
    setShowMeditation,
    meditationType,
    morningMeditationDone,
    eveningMeditationDone,
    loadMeditations,
    handleMeditationComplete,
    handleStartMeditation,
  };
}
