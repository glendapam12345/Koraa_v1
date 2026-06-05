import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

const VACIAR_OPTIONAL_HINT_DISMISSED_KEY = (userId: string) =>
  `koraa_vaciar_optional_hint_dismissed_v1_${userId}`;

const VACIAR_FLOW_CARD_DISMISSED_KEY = (userId: string) =>
  `koraa_vaciar_flow_card_dismissed_v1_${userId}`;

const VACIAR_DICTATE_HINT_DISMISSED_KEY = (userId: string) =>
  `koraa_vaciar_dictate_hint_dismissed_v1_${userId}`;

export function useVaciarHints(userId: string | undefined) {
  const [hasTasks, setHasTasks] = useState<boolean | null>(null);
  const [optionalHintDismissed, setOptionalHintDismissed] = useState(false);
  const [flowCardDismissed, setFlowCardDismissed] = useState(false);
  const [dictateHintDismissed, setDictateHintDismissed] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const loadHintState = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('tasks')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (error) {
        logger.error('Error verificando tareas:', error);
        return;
      }

      const userHasTasks = (data?.length || 0) > 0;
      setHasTasks(userHasTasks);

      let hintDismissedInStorage = false;
      try {
        hintDismissedInStorage =
          (await AsyncStorage.getItem(VACIAR_OPTIONAL_HINT_DISMISSED_KEY(user.id))) === '1';
      } catch {
        hintDismissedInStorage = false;
      }
      setOptionalHintDismissed(hintDismissedInStorage);

      let flowCardDismissedInStorage = false;
      try {
        flowCardDismissedInStorage =
          (await AsyncStorage.getItem(VACIAR_FLOW_CARD_DISMISSED_KEY(user.id))) === '1';
      } catch {
        flowCardDismissedInStorage = false;
      }
      setFlowCardDismissed(flowCardDismissedInStorage);

      let dictateHintDismissedInStorage = false;
      try {
        dictateHintDismissedInStorage =
          (await AsyncStorage.getItem(VACIAR_DICTATE_HINT_DISMISSED_KEY(user.id))) === '1';
      } catch {
        dictateHintDismissedInStorage = false;
      }
      setDictateHintDismissed(dictateHintDismissedInStorage);

      if (!userHasTasks) {
        setShowTooltip(hintDismissedInStorage);
      } else {
        setShowTooltip(false);
      }
    } catch (error) {
      logger.error('Error inesperado:', error);
    }
  }, []);

  const dismissFlowCard = useCallback(async () => {
    if (userId) {
      try {
        await AsyncStorage.setItem(VACIAR_FLOW_CARD_DISMISSED_KEY(userId), '1');
      } catch {
        /* no bloquear UI */
      }
    }
    setFlowCardDismissed(true);
  }, [userId]);

  const dismissDictateHint = useCallback(async () => {
    if (userId) {
      try {
        await AsyncStorage.setItem(VACIAR_DICTATE_HINT_DISMISSED_KEY(userId), '1');
      } catch {
        /* no bloquear UI */
      }
    }
    setDictateHintDismissed(true);
  }, [userId]);

  const dismissOptionalHint = useCallback(async () => {
    if (userId) {
      try {
        await AsyncStorage.setItem(VACIAR_OPTIONAL_HINT_DISMISSED_KEY(userId), '1');
      } catch {
        /* no bloquear UI */
      }
    }
    setOptionalHintDismissed(true);
  }, [userId]);

  return {
    hasTasks,
    setHasTasks,
    optionalHintDismissed,
    flowCardDismissed,
    dictateHintDismissed,
    showTooltip,
    setShowTooltip,
    loadHintState,
    dismissFlowCard,
    dismissDictateHint,
    dismissOptionalHint,
  };
}
