import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { QuickRecheckInModal } from '@/components/QuickRecheckInModal';
import { supabase } from '@/lib/supabase';
import { getLocalDateString } from '@/lib/dateLocal';
import { logger } from '@/lib/logger';
import { track } from '@/lib/analytics';
import { publishCheckInRefresh } from '@/lib/checkInRefresh';
import {
  DEFAULT_CHECK_IN_FOCUS,
  DEFAULT_CHECK_IN_TIME,
} from '@/lib/checkInDefaults';
import {
  openRecheckCheckIn,
  registerOpenRecheck,
  unregisterOpenRecheck,
} from '@/lib/recheckCheckInBridge';

type CheckInSnapshot = {
  emotion: string;
  energy: number;
  time: string;
  focus: string;
};

type RecheckContextValue = {
  openRecheck: (source?: string) => void;
};

const RecheckContext = createContext<RecheckContextValue>({
  openRecheck: (source) => openRecheckCheckIn(source),
});

export function useRecheckCheckIn(): RecheckContextValue {
  return useContext(RecheckContext);
}

async function fetchTodayCheckIn(): Promise<CheckInSnapshot | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('daily_check_ins')
      .select('emotion, energy_level, available_time, focus_level')
      .eq('user_id', user.id)
      .eq('date', getLocalDateString())
      .maybeSingle();

    if (error) {
      logger.error('Error cargando check-in para recheck:', error);
      return null;
    }

    if (!data?.emotion) return null;

    return {
      emotion: data.emotion,
      energy: data.energy_level || 0,
      time: data.available_time ?? '',
      focus: data.focus_level ?? '',
    };
  } catch (error) {
    logger.error('Error inesperado cargando check-in para recheck:', error);
    return null;
  }
}

function normalizeCheckInSnapshot(snapshot: CheckInSnapshot | null): CheckInSnapshot {
  return {
    emotion: snapshot?.emotion ?? '',
    energy: snapshot?.energy && snapshot.energy >= 1 ? snapshot.energy : 3,
    time: snapshot?.time?.trim() ? snapshot.time : DEFAULT_CHECK_IN_TIME,
    focus: snapshot?.focus?.trim() ? snapshot.focus : DEFAULT_CHECK_IN_FOCUS,
  };
}

function RecheckModalHost() {
  const [visible, setVisible] = useState(false);
  const [firstCheckIn, setFirstCheckIn] = useState(false);
  const [initial, setInitial] = useState<CheckInSnapshot | null>(null);
  const sourceRef = useRef('unknown');

  const openRecheck = useCallback(async (source = 'unknown') => {
    sourceRef.current = source;
    const checkIn = await fetchTodayCheckIn();
    const isFirstCheckIn = !checkIn?.emotion;
    setFirstCheckIn(isFirstCheckIn);
    void track(isFirstCheckIn ? 'check_in_opened' : 'recheck_opened', { source });
    setInitial(normalizeCheckInSnapshot(checkIn));
    setVisible(true);
  }, []);

  useEffect(() => {
    registerOpenRecheck(openRecheck);
    return () => unregisterOpenRecheck();
  }, [openRecheck]);

  const handleComplete = useCallback(() => {
    void track(firstCheckIn ? 'check_in_completed' : 'recheck_completed', {
      source: sourceRef.current,
    });
    publishCheckInRefresh();
    setVisible(false);
  }, [firstCheckIn]);

  const handleClose = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    <QuickRecheckInModal
      visible={visible && initial != null}
      firstCheckIn={firstCheckIn}
      onClose={handleClose}
      onComplete={handleComplete}
      initialEmotion={initial?.emotion ?? ''}
      initialEnergy={initial?.energy ?? 3}
      initialTime={initial?.time ?? DEFAULT_CHECK_IN_TIME}
      initialFocus={initial?.focus ?? DEFAULT_CHECK_IN_FOCUS}
    />
  );
}

export function RecheckCheckInProvider({ children }: { children: ReactNode }) {
  const openRecheck = useCallback((source?: string) => {
    openRecheckCheckIn(source);
  }, []);

  return (
    <RecheckContext.Provider value={{ openRecheck }}>
      {children}
      <RecheckModalHost />
    </RecheckContext.Provider>
  );
}
