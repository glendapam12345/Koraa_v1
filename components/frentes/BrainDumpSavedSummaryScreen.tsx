import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router, type Href } from 'expo-router';
import { FolderKanban } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { TranslationKey } from '@/lib/i18n';
import { CalmCard } from '@/components/ui/calm/CalmCard';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { useProjectsLibrary } from '@/hooks/useProjectsLibrary';
import { useUserLifeAreas } from '@/hooks/useUserLifeAreas';
import { supabase } from '@/lib/supabase';
import { computeProjectProgress, formatProjectDueDate } from '@/lib/projectProgress';
import { formatDurationLabel } from '@/lib/taskPlanningMeta';
import { frontThemeForKey } from '@/lib/frentes/frontTheme';
import type { LifeAreaKey } from '@/lib/lifeAreas/lifeAreaCatalog';
import {
  buildSavedSummaryAreaGroups,
  type SavedOrganizedContext,
  type SavedSummaryAreaGroup,
  type SavedSummaryPreviewItem,
} from '@/lib/review/buildBrainDumpSavedSummary';
import { ensureBrainDumpPresetInConfig } from '@/lib/review/brainDumpAreaPreset';
import type { LooseTaskSummary } from '@/lib/looseTasks';
import type { ProjectLibraryItem } from '@/hooks/useProjectsLibrary';

type BrainDumpSavedSummaryScreenProps = {
  userId: string;
  hasCheckInToday: boolean | null;
  savedContext: SavedOrganizedContext;
  onViewOrganized: () => void;
  onGoToHoy: () => void;
  onGoToCheckIn: () => void;
  onCaptureMore: () => void;
};

function ProjectProgressBar({ percent, color }: { percent: number; color: string }) {
  return (
    <View style={styles.progressTrack}>
      <View
        style={[
          styles.progressFill,
          {
            width: `${Math.max(percent > 0 ? 4 : 0, percent)}%`,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

function SummaryProjectRow({
  project,
  isNew,
  locale,
}: {
  project: ProjectLibraryItem;
  isNew: boolean;
  locale: 'es' | 'en';
}) {
  const { t } = useI18n();
  const progress = computeProjectProgress(project.taskCount, project.incompleteCount);
  const dueLabel = formatProjectDueDate(project.dueDate, locale);

  return (
    <TouchableOpacity
      style={styles.projectRow}
      onPress={() => router.push(`/project/${project.id}` as Href)}
      activeOpacity={0.88}
      accessibilityRole="button"
    >
      <View style={styles.projectTopRow}>
        <View style={[styles.projectDot, { backgroundColor: project.color }]} />
        <Text style={styles.projectName} numberOfLines={1}>
          {project.name}
        </Text>
        <Text style={[styles.projectPercent, { color: project.color }]}>
          {progress.total > 0
            ? t('areasCompact.progressPercent', { percent: progress.percent })
            : t('areasCompact.noStepsYet')}
        </Text>
      </View>

      <ProjectProgressBar percent={progress.percent} color={project.color} />

      <View style={styles.projectMetaRow}>
        {progress.total > 0 ? (
          <Text style={styles.projectMeta}>
            {t('areasCompact.progressDetail', {
              done: progress.completed,
              total: progress.total,
            })}
          </Text>
        ) : (
          <Text style={styles.projectMeta}>
            {t('areasCompact.taskOpenMany', { count: project.incompleteCount })}
          </Text>
        )}
        {dueLabel ? (
          <Text style={styles.projectDue}>{t('areasCompact.deadline', { date: dueLabel })}</Text>
        ) : null}
        {isNew ? <Text style={styles.newBadge}>{t('vaciar.areaReviewDraftProject')}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

function SummaryLooseTaskRow({
  item,
  locale,
}: {
  item: SavedSummaryPreviewItem;
  locale: 'es' | 'en';
}) {
  const { t } = useI18n();
  const dateLabel = item.scheduledDate
    ? formatProjectDueDate(item.scheduledDate, locale)
    : null;
  const durationLabel =
    item.estimatedMinutes && item.estimatedMinutes > 0
      ? formatDurationLabel(item.estimatedMinutes)
      : null;

  const metaParts = [dateLabel, durationLabel].filter(Boolean);

  return (
    <View style={styles.looseTaskRow}>
      <Text style={styles.looseTaskBullet}>·</Text>
      <View style={styles.looseTaskBody}>
        <Text style={styles.looseTaskTitle} numberOfLines={2}>
          {item.content}
        </Text>
        {metaParts.length > 0 ? (
          <Text style={styles.looseTaskMeta} numberOfLines={1}>
            {metaParts.join(' · ')}
          </Text>
        ) : (
          <Text style={styles.looseTaskMeta}>{t('vaciar.organizedSummaryLooseStep')}</Text>
        )}
      </View>
    </View>
  );
}

function SummaryAreaBlock({
  group,
  areaIndex,
  newProjectIds,
  locale,
}: {
  group: SavedSummaryAreaGroup;
  areaIndex: number;
  newProjectIds: Set<string>;
  locale: 'es' | 'en';
}) {
  const { t } = useI18n();
  const themeKey = group.area.catalogKey ?? 'other';
  const theme = frontThemeForKey(themeKey, areaIndex);

  return (
    <View style={[styles.areaBlock, { borderLeftColor: theme.accent }]}>
      <View style={styles.areaHeader}>
        <Text style={styles.areaEmoji}>{group.area.emoji}</Text>
        <View style={styles.areaHeaderText}>
          <Text style={[styles.areaEyebrow, { color: theme.accent }]}>
            {t('areasCompact.areaLabel')}
          </Text>
          <Text style={styles.areaName}>{group.area.name}</Text>
          <Text style={styles.areaMeta}>
            {t('vaciar.organizedSummaryAreaMeta', {
              projects: group.projects.length,
              tasks: group.looseTasks.length + group.projects.length,
            })}
          </Text>
        </View>
      </View>

      {group.projects.length > 0 ? (
        <View style={styles.projectList}>
          {group.projects.map((project) => (
            <SummaryProjectRow
              key={project.id}
              project={project}
              isNew={newProjectIds.has(project.id)}
              locale={locale}
            />
          ))}
        </View>
      ) : null}

      {group.looseTasks.length > 0 ? (
        <View style={styles.looseTaskList}>
          {group.looseTasks.map((task, index) => (
            <SummaryLooseTaskRow
              key={`${task.content}-${index}`}
              item={task}
              locale={locale}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function BrainDumpSavedSummaryScreen({
  userId,
  hasCheckInToday,
  savedContext,
  onViewOrganized,
  onGoToHoy,
  onGoToCheckIn,
  onCaptureMore,
}: BrainDumpSavedSummaryScreenProps) {
  const { t, locale } = useI18n();
  const { projects, looseCount, loading, reload } = useProjectsLibrary(userId, {
    hasCheckInToday,
  });
  const { config: lifeAreasConfig, loading: lifeAreasLoading } = useUserLifeAreas(userId);
  const [looseTasks, setLooseTasks] = useState<LooseTaskSummary[]>([]);

  const getDefaultLabel = useCallback(
    (key: LifeAreaKey) => t(`lifeAreas.${key}` as TranslationKey),
    [t],
  );

  const getPresetCustomLabel = useCallback(
    (presetCustomId: string) => t(`lifeAreasPreset.${presetCustomId}` as TranslationKey),
    [t],
  );

  const effectiveConfig = useMemo(
    () => ensureBrainDumpPresetInConfig(lifeAreasConfig),
    [lifeAreasConfig],
  );

  const newProjectIds = useMemo(
    () => new Set(savedContext.newProjectIds),
    [savedContext.newProjectIds],
  );

  useEffect(() => {
    reload(true);
  }, [reload]);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from('tasks')
        .select('id, content, created_at, scheduled_date, life_area_key, is_completed')
        .eq('user_id', userId)
        .is('project_id', null)
        .is('parent_task_id', null)
        .eq('is_completed', false)
        .order('created_at', { ascending: false });

      setLooseTasks((data as LooseTaskSummary[]) ?? []);
    })();
  }, [userId]);

  const areaGroups = useMemo(
    () =>
      buildSavedSummaryAreaGroups(
        projects,
        effectiveConfig,
        getDefaultLabel,
        looseTasks,
        savedContext,
        t('lifeAreas.other'),
        getPresetCustomLabel,
      ),
    [projects, effectiveConfig, getDefaultLabel, getPresetCustomLabel, looseTasks, savedContext, t],
  );

  const needsCheckIn = hasCheckInToday === false;
  const isLoading = loading || lifeAreasLoading;

  return (
    <View style={styles.root}>
      <CalmCard style={styles.heroCard}>
        <Text style={styles.heroEmoji}>✨</Text>
        <Text style={styles.heroTitle}>{t('vaciar.organizedSummaryTitle')}</Text>
        <Text style={styles.heroBody}>
          {t('vaciar.organizedSummaryBody', { count: savedContext.taskCount })}
        </Text>
        {savedContext.newProjectIds.length > 0 ? (
          <Text style={styles.heroMeta}>
            {t('vaciar.organizedSummaryNewProjects', {
              count: savedContext.newProjectIds.length,
            })}
          </Text>
        ) : null}
      </CalmCard>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={THEME.colors.calm.lavenderDeep} />
        </View>
      ) : (
        <View style={styles.scrollContent}>
          {areaGroups.length > 0 ? (
            areaGroups.map((group, index) => (
              <SummaryAreaBlock
                key={group.area.ref}
                group={group}
                areaIndex={index}
                newProjectIds={newProjectIds}
                locale={locale}
              />
            ))
          ) : (
            <CalmCard style={styles.emptyCard}>
              <FolderKanban size={28} color={THEME.colors.calm.lavenderDeep} />
              <Text style={styles.emptyText}>{t('vaciar.organizedSummaryEmpty')}</Text>
            </CalmCard>
          )}

          {looseCount > 0 && savedContext.previewItems.filter((item) => !item.projectId).length > 0 ? (
            <Text style={styles.globalLoose}>
              {t('vaciar.organizedSummaryLoose', {
                count: savedContext.previewItems.filter((item) => !item.projectId).length,
              })}
            </Text>
          ) : null}
        </View>
      )}

      <View style={styles.footer}>
        <CalmPrimaryButton
          label={t('vaciar.viewOrganizedLink')}
          onPress={onViewOrganized}
          large
        />

        <TouchableOpacity
          onPress={needsCheckIn ? onGoToCheckIn : onGoToHoy}
          style={styles.secondaryLink}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryText}>
            {needsCheckIn ? t('vaciar.savedGoCheckIn') : t('vaciar.savedGoHoySecondary')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onCaptureMore}
          style={styles.secondaryLink}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryText}>{t('vaciar.organizedSummaryCaptureMore')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    gap: THEME.spacing.sm,
  },
  heroCard: {
    alignItems: 'center',
    gap: THEME.spacing.xs,
    backgroundColor: THEME.colors.calm.blush,
    borderColor: THEME.colors.calm.lavender,
  },
  heroEmoji: {
    fontSize: 32,
    lineHeight: 38,
  },
  heroTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    textAlign: 'center',
  },
  heroBody: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  heroMeta: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
    textAlign: 'center',
  },
  scrollContent: {
    gap: THEME.spacing.sm,
    paddingBottom: THEME.spacing.sm,
  },
  centered: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  areaBlock: {
    gap: THEME.spacing.sm,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.fill[100],
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    borderLeftWidth: 4,
  },
  areaHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
  },
  areaEmoji: {
    fontSize: 22,
    lineHeight: 28,
  },
  areaHeaderText: {
    flex: 1,
    gap: 2,
  },
  areaEyebrow: {
    ...THEME.typography.micro,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: THEME.fonts.heading.bold,
  },
  areaName: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  areaMeta: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
  },
  projectList: {
    gap: THEME.spacing.xs,
  },
  projectRow: {
    gap: 6,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.standard,
    backgroundColor: THEME.colors.calm.mist,
  },
  projectTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  projectDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  projectName: {
    ...THEME.typography.body,
    flex: 1,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
  },
  projectPercent: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.colors.calm.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  projectMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  projectMeta: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
  },
  projectDue: {
    ...THEME.typography.small,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
  },
  newBadge: {
    ...THEME.typography.micro,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
    textTransform: 'uppercase',
  },
  looseInArea: {
    ...THEME.typography.caption,
    color: THEME.colors.text.tertiary,
    fontStyle: 'italic',
    paddingHorizontal: 4,
  },
  looseTaskList: {
    gap: THEME.spacing.xs,
    paddingTop: 2,
  },
  looseTaskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.standard,
    backgroundColor: THEME.colors.calm.mist,
  },
  looseTaskBullet: {
    ...THEME.typography.body,
    color: THEME.colors.calm.lavenderDeep,
    lineHeight: 20,
    marginTop: -1,
  },
  looseTaskBody: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  looseTaskTitle: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
    lineHeight: 20,
  },
  looseTaskMeta: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 16,
  },
  globalLoose: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    paddingVertical: THEME.spacing.xs,
  },
  emptyCard: {
    alignItems: 'center',
    gap: THEME.spacing.sm,
    paddingVertical: THEME.spacing.lg,
  },
  emptyText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
  },
  footer: {
    gap: THEME.spacing.xs,
    paddingTop: THEME.spacing.xs,
  },
  secondaryLink: {
    minHeight: THEME.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    ...THEME.typography.body,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
  },
});
