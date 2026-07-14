import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Bell } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { useStreak } from '@/hooks/today/useStreak';
import { useHasCheckInToday } from '@/hooks/useHasCheckInToday';
import { StreakAura } from '@/components/branding/StreakAura';
import { KoraaBloomLogo } from '@/components/branding/KoraaBloomLogo';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { CHECK_IN_ROUTE } from '@/lib/checkInNavigation';
import {
  getStreakAuraIntensity,
  getStreakLevelKey,
  getStreakGoalProgress,
} from '@/lib/streakLevel';
import {
  getStreakGoalDays,
  setStreakGoalDays,
  STREAK_GOAL_OPTIONS,
  type StreakGoalDays,
} from '@/lib/streakGoalPreferences';
import {
  DAILY_REMINDER_PRESETS,
  formatReminderTime,
  getDailyReminderTime,
  setDailyReminderTime,
} from '@/lib/notificationPreferences';
import { checkNotificationPermissions, scheduleDailyReminder, scheduleTaskCaptureReminder } from '@/hooks/useNotifications';

const STREAK_GOAL_LABEL_KEYS: Record<StreakGoalDays, 'hoy.streakGoalOption7' | 'hoy.streakGoalOption1Month' | 'hoy.streakGoalOption3Months' | 'hoy.streakGoalOption6Months'> = {
  7: 'hoy.streakGoalOption7',
  30: 'hoy.streakGoalOption1Month',
  90: 'hoy.streakGoalOption3Months',
  180: 'hoy.streakGoalOption6Months',
};

export default function StreakScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { user } = useAuth();
  const { currentStreak, loadStreak } = useStreak(user?.id);
  const { hasCheckInToday, refresh: refreshCheckIn } = useHasCheckInToday(user?.id);
  const [savedReminder, setSavedReminder] = useState({ hour: 9, minute: 0 });
  const [draftReminder, setDraftReminder] = useState({ hour: 9, minute: 0 });
  const [reminderSaving, setReminderSaving] = useState(false);
  const [reminderJustSaved, setReminderJustSaved] = useState(false);
  const [goalDays, setGoalDays] = useState<StreakGoalDays>(7);

  useEffect(() => {
    void loadStreak();
    void refreshCheckIn();
    void getDailyReminderTime().then((time) => {
      setSavedReminder(time);
      setDraftReminder(time);
    });
    void getStreakGoalDays(user?.id).then(setGoalDays);
  }, [loadStreak, refreshCheckIn, user?.id]);

  const selectGoal = useCallback(
    async (days: StreakGoalDays) => {
      setGoalDays(days);
      await setStreakGoalDays(days, user?.id);
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        void Haptics.selectionAsync();
      }
    },
    [user?.id],
  );

  const checkedInToday = hasCheckInToday === true;
  const daysToGoal = Math.max(0, goalDays - currentStreak);
  const ringProgress = getStreakGoalProgress(currentStreak, goalDays);
  const goalReached = currentStreak >= goalDays && goalDays > 0;

  const reminderDirty =
    draftReminder.hour !== savedReminder.hour || draftReminder.minute !== savedReminder.minute;

  const saveReminder = useCallback(async () => {
    if (Platform.OS === 'web') {
      setSavedReminder(draftReminder);
      setReminderJustSaved(true);
      return;
    }
    setReminderSaving(true);
    setReminderJustSaved(false);
    try {
      await setDailyReminderTime(draftReminder);
      setSavedReminder(draftReminder);
      const ok = await checkNotificationPermissions();
      if (!ok) {
        Alert.alert(t('settings.notifPermissionTitle'), t('settings.notifPermissionBody'));
      }
      await scheduleDailyReminder();
      await scheduleTaskCaptureReminder();
      setReminderJustSaved(true);
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } finally {
      setReminderSaving(false);
    }
  }, [draftReminder, t]);

  const streakLabel =
    currentStreak === 1
      ? t('yo.streakDayOne')
      : t('yo.streakDayMany');

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel={t('commonExtra.close')}
      >
        <X size={24} color={THEME.colors.text.main} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + THEME.spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[...THEME.colors.parami.moodCard]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Text style={styles.heroEyebrow}>{t('hoy.streakScreenEyebrow')}</Text>

          <StreakAura intensity={getStreakAuraIntensity(currentStreak)} contentSize={88}>
            <View style={styles.ringOuter}>
              <View style={[styles.ringFill, { height: `${Math.max(12, ringProgress * 100)}%` }]} />
              <View style={styles.ringInner}>
                <Text style={styles.fireLarge}>🔥</Text>
              </View>
            </View>
          </StreakAura>

          <Text style={styles.streakCount}>
            {currentStreak > 0 ? currentStreak : '—'}
          </Text>
          <Text style={styles.streakUnit}>{streakLabel}</Text>
          <Text style={styles.levelLine}>{t(getStreakLevelKey(currentStreak))}</Text>
          <Text style={styles.heroSub}>
            {checkedInToday ? t('hoy.streakScreenTodayYes') : t('hoy.streakScreenTodayNo')}
          </Text>
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('hoy.streakGoalTitle')}</Text>
          <Text style={styles.sectionBody}>{t('hoy.streakGoalSubtitle')}</Text>
          <View style={styles.chipsRow}>
            {STREAK_GOAL_OPTIONS.map((option) => {
              const active = goalDays === option;
              return (
                <Pressable
                  key={option}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => void selectGoal(option)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={t(STREAK_GOAL_LABEL_KEYS[option])}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {t(STREAK_GOAL_LABEL_KEYS[option])}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.goalProgress}>
            {t('hoy.streakGoalProgress', {
              current: Math.min(currentStreak, goalDays),
              goal: goalDays,
            })}
          </Text>
          <Text style={styles.sectionBody}>
            {goalReached
              ? t('hoy.streakGoalReached', { days: goalDays })
              : t('hoy.streakGoalNext', { days: daysToGoal, milestone: goalDays })}
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Bell size={18} color={THEME.colors.calm.lavenderDeep} />
            <Text style={styles.sectionTitle}>{t('hoy.streakReminderTitle')}</Text>
          </View>
          <Text style={styles.sectionBody}>{t('hoy.streakReminderBody')}</Text>
          <Text style={styles.reminderCurrent}>
            {t('settings.reminderHint', { time: formatReminderTime(savedReminder) })}
          </Text>
          <View style={styles.chipsRow}>
            {DAILY_REMINDER_PRESETS.map((preset) => {
              const active =
                draftReminder.hour === preset.hour && draftReminder.minute === preset.minute;
              return (
                <Pressable
                  key={preset.label}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => {
                    setDraftReminder({ hour: preset.hour, minute: preset.minute });
                    setReminderJustSaved(false);
                  }}
                  disabled={reminderSaving}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {preset.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <CalmPrimaryButton
            label={
              reminderJustSaved && !reminderDirty
                ? t('hoy.streakReminderSaved')
                : t('common.save')
            }
            onPress={() => void saveReminder()}
            disabled={reminderSaving || !reminderDirty}
            loading={reminderSaving}
            variant={reminderDirty ? 'default' : 'soft'}
          />
        </View>

        <Text style={styles.softNote}>{t('hoy.streakSoftNote')}</Text>

        {!checkedInToday ? (
          <CalmPrimaryButton
            label={t('hoy.streakCheckInCta')}
            onPress={() => router.replace(CHECK_IN_ROUTE)}
            large
          />
        ) : (
          <View style={styles.todayDone}>
            <KoraaBloomLogo size={32} active />
            <Text style={styles.todayDoneText}>{t('yo.returnedToday')}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.colors.calm.background,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    marginRight: THEME.spacing.sm,
    padding: THEME.spacing.sm,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: THEME.layout.screenPaddingX,
    gap: THEME.spacing.md,
  },
  hero: {
    borderRadius: THEME.borderRadius.card,
    padding: THEME.spacing.lg,
    alignItems: 'center',
    gap: THEME.spacing.xs,
    ...THEME.shadows.card,
  },
  heroEyebrow: {
    ...THEME.typography.sectionEyebrow,
    color: THEME.colors.onGradientMuted,
    marginBottom: THEME.spacing.xs,
  },
  ringOuter: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 5,
    borderColor: THEME.colors.surfaceOverlay.glassLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: THEME.colors.surfaceOverlay.light,
  },
  ringFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: THEME.colors.surfaceOverlay.glassBorderFaint,
  },
  ringInner: {
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fireLarge: {
    fontSize: 36,
    lineHeight: 42,
  },
  streakCount: {
    fontSize: 48,
    lineHeight: 52,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.onGradient,
    marginTop: THEME.spacing.sm,
  },
  streakUnit: {
    ...THEME.typography.body,
    color: THEME.colors.onGradientMuted,
    fontFamily: THEME.fonts.heading.medium,
  },
  levelLine: {
    ...THEME.typography.h3,
    color: THEME.colors.onGradient,
    textAlign: 'center',
    marginTop: THEME.spacing.xs,
  },
  heroSub: {
    ...THEME.typography.caption,
    color: THEME.colors.onGradientFaint,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: THEME.spacing.xs,
  },
  section: {
    ...THEME.surfaces.elevated,
    padding: THEME.spacing.md,
    gap: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.rounded,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
  },
  sectionTitle: {
    ...THEME.typography.cardTitle,
    color: THEME.colors.text.main,
  },
  sectionBody: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
  },
  goalProgress: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
    marginTop: THEME.spacing.xs,
  },
  reminderCurrent: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.xs,
    marginTop: THEME.spacing.xs,
  },
  chip: {
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.mist,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  chipActive: {
    backgroundColor: THEME.colors.calm.lavender,
    borderColor: THEME.colors.calm.lavenderDeep,
  },
  chipText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
  },
  chipTextActive: {
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
  softNote: {
    ...THEME.typography.small,
    color: THEME.colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: THEME.spacing.sm,
  },
  todayDone: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.sm,
    paddingVertical: THEME.spacing.md,
  },
  todayDoneText: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
  },
});
