import { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Pause, Play } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { trackFocusSession } from '@/lib/productAnalytics';

const DEFAULT_SECONDS = 25 * 60;

function formatTime(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function FocusSessionScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const [remaining, setRemaining] = useState(DEFAULT_SECONDS);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasStartedRef = useRef(false);
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    trackFocusSession('opened');
  }, []);

  useEffect(() => {
    if (remaining === 0 && hasStartedRef.current && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      trackFocusSession('completed');
    }
  }, [remaining]);

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

  const progress = 1 - remaining / DEFAULT_SECONDS;

  const handleClose = useCallback(() => {
    if (remaining > 0 && hasStartedRef.current && !hasCompletedRef.current) {
      trackFocusSession('abandoned', { remaining_seconds: remaining });
    }
    router.back();
  }, [remaining]);

  const handleToggleRunning = useCallback(() => {
    if (remaining === 0) {
      setRemaining(DEFAULT_SECONDS);
      setRunning(false);
      hasStartedRef.current = false;
      hasCompletedRef.current = false;
      return;
    }

    setRunning((wasRunning) => {
      const next = !wasRunning;
      if (next) {
        hasStartedRef.current = true;
        trackFocusSession('started', { remaining_seconds: remaining });
      } else {
        trackFocusSession('paused', { remaining_seconds: remaining });
      }
      return next;
    });
  }, [remaining]);

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
    marginBottom: THEME.spacing.xl,
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
