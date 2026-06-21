import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, List, Plus } from 'lucide-react-native';
import { router, type Href } from 'expo-router';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { ProjectMetaRow } from '@/components/projects/ProjectMetaRow';
import type { ProjectLibraryItem } from '@/hooks/useProjectsLibrary';
import { getProjectEmoji } from '@/lib/projectEmoji';
import { computeProjectProgress } from '@/lib/projectProgress';

type ProjectLibraryCardProps = {
  userId: string;
  compact?: boolean;
  onAddTask?: (projectId: string | null) => void;
} & (
  | { mode: 'project'; project: ProjectLibraryItem }
  | { mode: 'loose'; looseCount: number }
);

const UI_ACCENT = THEME.colors.calm.lavenderDeep;

export function ProjectLibraryCard({ onAddTask, compact = false, ...props }: ProjectLibraryCardProps) {
  const { t } = useI18n();
  const isLoose = props.mode === 'loose';
  const project = isLoose ? null : props.project;
  const looseCount = isLoose ? props.looseCount : 0;

  const openFullRoute: Href = isLoose
    ? '/project/sin-proyecto'
    : (`/project/${project!.id}` as Href);

  const displayTitle = isLoose ? t('projectsUi.looseTitle') : project!.name;
  const taskCount = isLoose ? looseCount : project!.taskCount;
  const incompleteCount = isLoose ? looseCount : project!.incompleteCount;
  const progress = computeProjectProgress(taskCount, incompleteCount);

  const taskCountLabel =
    taskCount === 0
      ? t('projectsUi.noTasks')
      : taskCount === 1
        ? t('projects.libraryTaskCountOne')
        : t('projects.libraryTaskCount', { count: taskCount });

  const progressLabel =
    taskCount > 0
      ? t('projects.libraryProgressShort', { percent: progress.percent })
      : null;

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <View style={[styles.card, isLoose && styles.cardLooseOuter, compact && styles.cardCompact]}>
        {isLoose ? (
          <LinearGradient
            colors={[THEME.colors.calm.mist, THEME.colors.calm.blush]}
            style={styles.cardLooseGradient}
          />
        ) : null}
        <View
          style={[
            styles.colorBar,
            {
              backgroundColor: isLoose
                ? THEME.colors.text.tertiary
                : project!.color || THEME.colors.gradient.blue,
            },
          ]}
        />
        <TouchableOpacity
          style={styles.cardMain}
          onPress={() => router.push(openFullRoute)}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel={
            isLoose
              ? t('projects.openLooseA11y', { count: looseCount })
              : t('projects.openProjectA11y', { name: project!.name })
          }
        >
          {isLoose ? (
            <View style={styles.looseTitleRow}>
              <List size={18} color={UI_ACCENT} />
              <Text style={styles.cardTitle} numberOfLines={1}>
                {displayTitle}
              </Text>
            </View>
          ) : (
            <View style={styles.titleRow}>
              <Text style={styles.projectEmoji}>{getProjectEmoji(project!.name)}</Text>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {displayTitle}
              </Text>
            </View>
          )}

          <View style={styles.statsRow}>
            <Text style={styles.statsText}>{taskCountLabel}</Text>
            {progressLabel ? (
              <>
                <Text style={styles.statsDot}>·</Text>
                <Text style={styles.statsText}>{progressLabel}</Text>
              </>
            ) : null}
          </View>

          {!isLoose && project ? (
            <ProjectMetaRow
              taskCount={project.taskCount}
              incompleteCount={project.incompleteCount}
              dueDate={project.dueDate}
              accentColor={project.color || THEME.colors.gradient.blue}
            />
          ) : null}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onAddTask?.(isLoose ? null : project!.id)}
          style={styles.iconBtn}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={
            isLoose
              ? t('projects.addA11y')
              : t('projects.addTaskToProjectA11y', { name: project!.name })
          }
        >
          <Plus size={20} color={UI_ACCENT} strokeWidth={2.2} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push(openFullRoute)}
          style={styles.iconBtn}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t('projects.openFullProject')}
        >
          <ChevronRight size={22} color={UI_ACCENT} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: THEME.spacing.sm + 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.calm.card,
    borderRadius: THEME.borderRadius.rounded,
    paddingVertical: THEME.spacing.md,
    paddingRight: THEME.spacing.xs,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    overflow: 'hidden',
    ...THEME.shadows.card,
  },
  cardLooseOuter: {
    ...THEME.shadows.soft,
  },
  cardLooseGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  colorBar: {
    width: 5,
    alignSelf: 'stretch',
    minHeight: 56,
    borderTopLeftRadius: THEME.borderRadius.standard,
    borderBottomLeftRadius: THEME.borderRadius.standard,
    marginRight: THEME.spacing.sm,
  },
  cardMain: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  looseTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  projectEmoji: {
    fontSize: THEME.typography.displayEmojiMd.fontSize,
    lineHeight: 26,
    width: 28,
    textAlign: 'center',
  },
  cardTitle: {
    ...THEME.typography.cardTitle,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  statsText: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
  },
  statsDot: {
    ...THEME.typography.small,
    color: THEME.colors.text.tertiary,
  },
  iconBtn: {
    padding: THEME.spacing.sm,
    minWidth: THEME.sizes.touchTarget,
    minHeight: THEME.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrapCompact: {
    marginBottom: 0,
  },
  cardCompact: {
    borderRadius: 14,
    ...THEME.shadows.soft,
  },
});
