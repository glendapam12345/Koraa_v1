import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Pause, Play } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { trackFocusSession } from '@/lib/productAnalytics';
import type { TranslationKey } from '@/lib/i18n';

const DURATION_OPTIONS = [5, 10, 25] as const;
type DurationMinutes = (typeof DURATION_OPTIONS)[number];

const DURATION_LABEL_KEYS: Record<DurationMinutes, TranslationKey> = {
  5: 'focus.duration5',
  10: 'focus.duration10',
  25: 'focus.duration25',
};

function parseDurationMinutes(raw: string | string[] | undefined): DurationMinutes {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = Number(value);
  if (n === 10 || n === 25) return n;
  return 5;
}

function formatTime(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function FocusSessionScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { minutes: minutesParam } = useLocalSearchParams<{ minutes?: string }>();
  const initialMinutes = parseDurationMinutes(minutesParam);
  const [durationMinutes, setDurationMinutes] = useState<DurationMinutes>(initialMinutes);
  const totalSeconds = durationMinutes * 60;
  const [remaining, setRemaining] = useState(totalSeconds);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasStartedRef = useRef(false);
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    trackFocusSession('opened');
  }, []);

  useEffect(() => {
    setRemaining(durationMinutes * 60);
    setRunning(false);
    hasStartedRef.current = false;
    hasCompletedRef.current = false;
  }, [durationMinutes]);

  useEffect(() => {
    if (remaining === 0 && hasStartedRef.current && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      trackFocusSession('completed', { duration_minutes: durationMinutes });
    }
  }, [remaining, durationMinutes]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!running) {
      clearTimer();
      return;
    }
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearTimer();
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return clearTimer;
  }, [running, clearTimer]);

  const progress = useMemo(() => 1 - remaining / totalSeconds, [remaining, totalSeconds]);

  const handleClose = useCallback(() => {
    if (remaining > 0 && hasStartedRef.current && !hasCompletedRef.current) {
      trackFocusSession('abandoned', {
        remaining_seconds: remaining,
        duration_minutes: durationMinutes,
      });
    }
    router.back();
  }, [remaining, durationMinutes]);

  const handleToggleRunning = useCallback(() => {
    if (remaining === 0) {
      setRemaining(totalSeconds);
      setRunning(false);
      hasStartedRef.current = false;
      hasCompletedRef.current = false;
      return;
    }

    setRunning((wasRunning) => {
      const next = !wasRunning;
      if (next) {
        hasStartedRef.current = true;
        trackFocusSession('started', {
          remaining_seconds: remaining,
          duration_minutes: durationMinutes,
        });
      } else {
        trackFocusSession('paused', {
          remaining_seconds: remaining,
          duration_minutes: durationMinutes,
        });
      }
      return next;
    });
  }, [remaining, totalSeconds, durationMinutes]);

  const selectDuration = useCallback(
    (minutes: DurationMinutes) => {
      if (running) return;
      setDurationMinutes(minutes);
    },
    [running],
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top + THEME.spacing.sm }]}>
      <TouchableOpacity
        style={styles.close}
        onPress={handleClose}
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
      >
        <X size={24} color={THEME.colors.text.secondary} />
      </TouchableOpacity>

      <Text style={styles.screenTitle}>{t('focus.sessionTitle')}</Text>
      <Text style={styles.mode}>{t('focus.sessionMode')}</Text>

      <Text style={styles.durationLabel}>{t('focus.durationLabel')}</Text>
      <View style={styles.durationRow}>
        {DURATION_OPTIONS.map((minutes) => {
          const selected = durationMinutes === minutes;
          return (
            <TouchableOpacity
              key={minutes}
              style={[styles.durationChip, selected && styles.durationChipSelected]}
              onPress={() => selectDuration(minutes)}
              disabled={running}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityState={{ selected, disabled: running }}
              accessibilityLabel={t(DURATION_LABEL_KEYS[minutes])}
            >
              <Text style={[styles.durationChipText, selected && styles.durationChipTextSelected]}>
                {t(DURATION_LABEL_KEYS[minutes])}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.ringOuter}>
        <LinearGradient
          colors={[THEME.colors.calm.blush, THEME.colors.calm.lavender]}
          style={[styles.ringFill, { opacity: 0.35 + progress * 0.45 }]}
        />
        <View style={styles.ringInner}>
          <Text style={styles.timer}>{formatTime(remaining)}</Text>
          <Text style={styles.hint}>{t('focus.sessionHint')}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.mainBtn}
        onPress={handleToggleRunning}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={running ? t('focus.sessionPause') : t('focus.sessionStart')}
      >
        <LinearGradient
          colors={[THEME.colors.calm.lavenderDeep, THEME.colors.gradient.pink]}
          style={styles.mainBtnGradient}
        >
          {running ? (
            <Pause size={22} color={THEME.colors.onGradient} />
          ) : (
            <Play size={22} color={THEME.colors.onGradient} />
          )}
          <Text style={styles.mainBtnText}>
            {remaining === 0
              ? t('focus.sessionRestart')
              : running
                ? t('focus.sessionPause')
                : t('focus.sessionStart')}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.colors.calm.background,
    paddingHorizontal: THEME.layout.screenPaddingX,
    paddingBottom: THEME.spacing.xl,
    alignItems: 'center',
  },
  close: {
    alignSelf: 'flex-end',
    padding: THEME.spacing.sm,
    marginBottom: THEME.spacing.md,
  },
  screenTitle: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: THEME.spacing.xs,
  },
  mode: {
    ...THEME.typography.h2,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    marginBottom: THEME.spacing.md,
    textAlign: 'center',
  },
  durationLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.sm,
    textAlign: 'center',
  },
  durationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: THEME.spacing.xs,
    marginBottom: THEME.spacing.lg,
    alignSelf: 'stretch',
  },
  durationChip: {
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.fill[100],
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
  },
  durationChipSelected: {
    backgroundColor: THEME.colors.calm.lavender,
    borderColor: THEME.colors.calm.lavenderDeep,
  },
  durationChipText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
    textAlign: 'center',
  },
  durationChipTextSelected: {
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
  ringOuter: {
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: THEME.colors.calm.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.xl,
    borderWidth: 2,
    borderColor: THEME.colors.calm.border,
    overflow: 'hidden',
  },
  ringFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 130,
  },
  ringInner: {
    alignItems: 'center',
    padding: THEME.spacing.lg,
  },
  timer: {
    fontSize: 48,
    lineHeight: 56,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
  },
  hint: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    marginTop: THEME.spacing.sm,
    textAlign: 'center',
  },
  mainBtn: {
    width: '100%',
    maxWidth: 320,
    borderRadius: THEME.borderRadius.pill,
    overflow: 'hidden',
    ...THEME.shadows.soft,
  },
  mainBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.sm,
    paddingVertical: THEME.spacing.md,
    minHeight: THEME.sizes.touchTarget + 8,
  },
  mainBtnText: {
    ...THEME.typography.body,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
  },
});
