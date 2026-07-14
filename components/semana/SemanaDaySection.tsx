import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Plus } from 'lucide-react-native';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { Task } from '@/hooks/useTasks';
import { SemanaInteractiveTaskList } from '@/components/semana/SemanaInteractiveTaskList';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { getEmotionCalendarAccent, getEmotionCalendarFill } from '@/lib/emotionCalendarColors';
import {
  ProjectQuickAddTaskModal,
  type ProjectQuickAddTarget,
} from '@/components/projects/ProjectQuickAddTaskModal';

type ProjectInfo = {
  name: string;
  color: string;
};

type SemanaDaySectionProps = {
  dateStr: string;
  title: string;
  tasks: Task[];
  projectsMap: Record<string, ProjectInfo>;
  userId?: string;
  quickAddProjects?: { id: string; name: string; color: string }[];
  isToday?: boolean;
  hasCheckInToday?: boolean;
  checkInChipText?: string | null;
  emotionId?: string | null;
  energyLevel?: number | null;
  focusCount?: number | null;
  globalCheckInBannerVisible?: boolean;
  /** Oculta empty duplicado cuando ya hay banner global de check-in. */
  suppressEmptyWhenGlobalBanner?: boolean;
  addTasksA11yLabel: string;
  addMoreA11yLabel: string;
  onTasksChanged: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
};

export function SemanaDaySection({
  dateStr,
  title,
  tasks,
  projectsMap,
  userId,
  quickAddProjects = [],
  isToday = false,
  hasCheckInToday = false,
  checkInChipText = null,
  emotionId = null,
  energyLevel = null,
  focusCount = null,
  globalCheckInBannerVisible = false,
  suppressEmptyWhenGlobalBanner = false,
  addTasksA11yLabel,
  addMoreA11yLabel,
  onTasksChanged,
  showToast,
}: SemanaDaySectionProps) {
  const { t } = useI18n();
  const [quickAddTarget, setQuickAddTarget] = useState<ProjectQuickAddTarget | null>(null);
  const emotionAccent = emotionId ? getEmotionCalendarAccent(emotionId) : null;
  const emotionFill = emotionId ? getEmotionCalendarFill(emotionId) : null;
  const hasCheckIn = Boolean(checkInChipText);

  const openQuickAdd = () => {
    setQuickAddTarget({ mode: 'day', date: dateStr, dayLabel: title });
  };

  const openHoy = () => {
    router.push('/(tabs)');
  };

  type EmptyVariant = 'noCheckInToday' | 'noCheckInTodaySoft' | 'lightDay' | 'default';

  const showHeavyDayBanner =
    isToday &&
    hasCheckIn &&
    energyLevel != null &&
    energyLevel <= 2 &&
    tasks.length > 3 &&
    focusCount != null;

  const emptyVariant: EmptyVariant = (() => {
    if (isToday && !hasCheckIn) {
      return globalCheckInBannerVisible ? 'noCheckInTodaySoft' : 'noCheckInToday';
    }
    if (hasCheckIn && tasks.length === 0) return 'lightDay';
    return 'default';
  })();

  const emptyCopy = {
    noCheckInToday: {
      title: t('semana.emptyTodayNoCheckIn'),
      hint: t('semana.emptyTodayNoCheckInHint'),
      cta: t('semana.emptyTodayNoCheckInCta'),
      onPress: openHoy,
      a11y: t('semana.emptyTodayNoCheckInCta'),
      showCta: true,
    },
    noCheckInTodaySoft: {
      title: t('semana.emptyTodayNoCheckInSoft'),
      hint: t('semana.emptyTodayNoCheckInSoftHint'),
      cta: '',
      onPress: openHoy,
      a11y: t('semana.emptyTodayNoCheckInSoft'),
      showCta: false,
    },
    lightDay: {
      title: t('semana.emptyLightDay'),
      hint: t('semana.emptyLightDayHint'),
      cta: t('semana.addTasks'),
      onPress: openQuickAdd,
      a11y: addTasksA11yLabel,
      showCta: true,
    },
    default: {
      title: t('semana.emptyDay'),
      hint: t('semana.emptyHint'),
      cta: t('semana.addTasks'),
      onPress: openQuickAdd,
      a11y: addTasksA11yLabel,
      showCta: true,
    },
  }[emptyVariant];

  const renderCheckInChip = () => {
    if (energyLevel != null && energyLevel > 0) {
      const wordKey =
        energyLevel <= 1
          ? 'hoy.energyWord1'
          : energyLevel === 2
            ? 'hoy.energyWord2'
            : energyLevel === 3
              ? 'hoy.energyWord3'
              : energyLevel === 4
                ? 'hoy.energyWord4'
                : 'hoy.energyWord5';
      return (
        <View style={styles.energyBadge}>
          <Text style={styles.energyBadgeText}>
            {t('semana.energyDayBadge', { word: t(wordKey as never) })}
          </Text>
        </View>
      );
    }
    if (!checkInChipText) return null;
    return (
      <View
        style={[
          styles.dayCheckInChip,
          emotionFill ? { backgroundColor: emotionFill, borderColor: emotionAccent ?? undefined } : null,
        ]}
      >
        <Text style={styles.dayCheckInChipText} numberOfLines={1}>
          {checkInChipText}
        </Text>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={[styles.dayHeader, isToday && styles.dayHeaderToday]}>
      <View style={styles.dayHeaderText}>
        <Text style={styles.dayLabel} numberOfLines={1}>
          {title}
        </Text>
        {isToday ? <Text style={styles.todaySoft}>{t('semana.today')}</Text> : null}
      </View>
      {renderCheckInChip()}
    </View>
  );

  return (
    <View
      style={styles.daySection}
      accessibilityRole="summary"
      accessibilityLabel={t('semanaExtra.a11yDaySection', { day: title })}
    >
      {renderHeader()}
      <View style={styles.dayBody}>
        {tasks.length === 0 ? (
          suppressEmptyWhenGlobalBanner ? null : (
          <View style={styles.emptyDay}>
            <Text style={styles.emptyDayEmoji}>
              {emptyVariant === 'lightDay'
                ? '🌿'
                : emptyVariant === 'noCheckInToday' || emptyVariant === 'noCheckInTodaySoft'
                  ? '💜'
                  : '📅'}
            </Text>
            <Text style={styles.emptyDayText}>{emptyCopy.title}</Text>
            <Text style={styles.emptyDayHint}>{emptyCopy.hint}</Text>
            {emptyCopy.showCta ? (
              <CalmPrimaryButton
                label={emptyCopy.cta}
                onPress={emptyCopy.onPress}
                accessibilityLabel={emptyCopy.a11y}
              />
            ) : null}
          </View>
          )
        ) : (
          <>
            {showHeavyDayBanner ? (
              <TouchableOpacity
                style={styles.heavyDayBanner}
                onPress={openHoy}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={t('semana.emptyHeavyDayCta')}
              >
                <Text style={styles.heavyDayTitle}>
                  {t('semana.emptyHeavyDay', { count: focusCount ?? 0, total: tasks.length })}
                </Text>
                <Text style={styles.heavyDayCta}>{t('semana.emptyHeavyDayCta')}</Text>
              </TouchableOpacity>
            ) : null}
            <SemanaInteractiveTaskList
              tasks={tasks}
              projectsMap={projectsMap}
              onTasksChanged={onTasksChanged}
              showToast={showToast}
              disableSwipe
            />
            <TouchableOpacity
              style={styles.addDayButtonOutlined}
              onPress={openQuickAdd}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={addMoreA11yLabel}
              accessibilityHint={t('semanaExtra.a11yAddMoreHint')}
            >
              <Plus size={16} color={THEME.colors.gradient.blue} />
              <Text style={styles.addDayButtonTextOutlined}>{t('semana.addMore')}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <ProjectQuickAddTaskModal
        visible={quickAddTarget != null}
        target={quickAddTarget}
        userId={userId}
        projects={quickAddProjects}
        hasCheckInToday={hasCheckInToday}
        onClose={() => setQuickAddTarget(null)}
        onSaved={({ title: savedTitle, dayLabel }) => {
          onTasksChanged();
          showToast(
            dayLabel
              ? t('semana.quickAddDaySuccess', { title: savedTitle, day: dayLabel })
              : t('projects.quickAddSuccessLoose', { title: savedTitle }),
            'success',
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  daySection: {
    marginBottom: 0,
    ...THEME.surfaces.elevated,
    padding: 0,
    overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: THEME.spacing.sm,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: 0,
    backgroundColor: THEME.colors.calm.mist,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THEME.colors.calm.border,
  },
  dayHeaderToday: {
    backgroundColor: THEME.colors.tint.blue.veryFaint,
  },
  dayHeaderText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  energyBadge: {
    maxWidth: '52%',
    borderRadius: THEME.borderRadius.pill,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 6,
    backgroundColor: THEME.colors.calm.lavender,
    borderWidth: 1,
    borderColor: THEME.colors.calm.lavenderDeep,
  },
  energyBadgeText: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    lineHeight: 16,
  },
  dayCheckInChip: {
    maxWidth: '48%',
    ...THEME.surfaces.elevated,
    borderRadius: THEME.borderRadius.pill,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  dayCheckInChipText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
  },
  todayHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    flexShrink: 1,
  },
  dayBody: {
    padding: THEME.spacing.md,
  },
  dayLabel: {
    ...THEME.typography.sectionTitle,
    fontSize: 20,
    lineHeight: 26,
    color: THEME.colors.text.main,
  },
  todaySoft: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
  },
  dayLabelToday: {
    color: THEME.colors.text.main,
  },
  todayBadge: {
    marginLeft: THEME.spacing.sm,
    backgroundColor: THEME.colors.calm.lavenderDeep,
    paddingHorizontal: THEME.spacing.xs,
    paddingVertical: 2,
    borderRadius: THEME.borderRadius.standard,
  },
  todayBadgeText: {
    ...THEME.typography.small,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
  },
  emptyDay: {
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.sm,
    alignItems: 'center',
  },
  emptyDayEmoji: {
    fontSize: 36,
    marginBottom: THEME.spacing.xs,
  },
  emptyDayText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    marginBottom: 4,
    textAlign: 'center',
  },
  emptyDayHint: {
    ...THEME.typography.small,
    color: THEME.colors.text.tertiary,
    marginBottom: THEME.spacing.md,
    textAlign: 'center',
    lineHeight: 18,
  },
  heavyDayBanner: {
    backgroundColor: THEME.colors.calm.mist,
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    padding: THEME.spacing.sm,
    marginBottom: THEME.spacing.sm,
    gap: 4,
  },
  heavyDayTitle: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    lineHeight: 20,
  },
  heavyDayCta: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
  },
  addDayButtonOutlined: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.xs,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    backgroundColor: THEME.colors.fill[100],
    marginTop: THEME.spacing.xs,
    minHeight: THEME.sizes.touchTarget,
  },
  addDayButtonTextOutlined: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
  },
});
