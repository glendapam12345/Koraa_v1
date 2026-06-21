import { View, Text, StyleSheet, TouchableOpacity, Pressable, Platform } from 'react-native';
import { ArrowRightLeft, ChevronDown, ChevronUp } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { ProjectForMatch } from '@/lib/batchProjectMatch';
import { FrenteChip } from '@/components/frentes/FrenteChip';
import { frontThemeByIndex } from '@/lib/frentes/frontTheme';
import { getProjectEmoji } from '@/lib/projectEmoji';

type CaptureProjectsSectionProps = {
  projects: ProjectForMatch[];
  onAddProject?: () => void;
};

export function CaptureProjectsSection({ projects, onAddProject }: CaptureProjectsSectionProps) {
  const { t } = useI18n();

  if (projects.length === 0 && !onAddProject) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{t('frentes.yourProjects')}</Text>
      <Text style={styles.sub}>{t('frentes.yourProjectsSub')}</Text>
      <View style={styles.grid}>
        {projects.map((project, index) => (
          <FrenteChip
            key={project.id}
            emoji={getProjectEmoji(project.name)}
            name={project.name}
            theme={frontThemeByIndex(index)}
          />
        ))}
        {onAddProject ? (
          <FrenteChip
            emoji=""
            name={t('frentes.newProject')}
            theme={frontThemeByIndex(projects.length)}
            variant="add"
            onPress={onAddProject}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.xs,
  },
  title: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    lineHeight: 22,
  },
  sub: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  list: {
    gap: 6,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  taskRowPressed: {
    opacity: 0.94,
  },
  taskRowPriority: {
    borderWidth: 1,
    borderColor: THEME.colors.surfaceOverlay.glassBorderLight,
  },
  priorityCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityBtn: {
    minWidth: 28,
    minHeight: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityBtnDisabled: {
    opacity: 0.35,
  },
  taskDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
  },
  taskBody: {
    flex: 1,
    gap: 6,
  },
  taskText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    lineHeight: 18,
    fontFamily: THEME.fonts.heading.medium,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  badgePill: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
    backgroundColor: THEME.colors.surfaceOverlay.glassHeavy,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.borderRadius.pill,
    overflow: 'hidden',
    flex: 1,
  },
  badgeLoose: {
    color: THEME.colors.text.tertiary,
  },
  badgeNew: {
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
  },
  moveBtn: {
    minWidth: 28,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

type FrontTaskRow = {
  captureId: string;
  content: string;
};

type FrontTaskListProps = {
  tasks: FrontTaskRow[];
  themeAccent: string;
  themeTaskBg: string;
  items: { id: string; assignToProject: boolean; selectedProjectId: string | null; createProjectOnSave?: boolean }[];
  projects: ProjectForMatch[];
  displayName: string;
  onMoveTask: (captureId: string) => void;
  onAssignTask: (captureId: string) => void;
  onMoveUp: (captureId: string) => void;
  onMoveDown: (captureId: string) => void;
};

export function FrontTaskList({
  tasks,
  themeAccent,
  themeTaskBg,
  items,
  projects,
  displayName,
  onMoveTask,
  onAssignTask,
  onMoveUp,
  onMoveDown,
}: FrontTaskListProps) {
  const { t } = useI18n();

  const badgeFor = (captureId: string): { label: string; kind: 'loose' | 'new' | 'existing' } => {
    const item = items.find((entry) => entry.id === captureId);
    if (!item) return { label: t('frentes.assignmentLooseShort'), kind: 'loose' };
    if (item.assignToProject && item.selectedProjectId) {
      const project = projects.find((entry) => entry.id === item.selectedProjectId);
      return { label: project?.name ?? t('frentes.assignmentExistingFallback'), kind: 'existing' };
    }
    if (item.createProjectOnSave) {
      return { label: t('frentes.assignmentNewBadge', { name: displayName }), kind: 'new' };
    }
    return { label: t('frentes.assignmentLooseShort'), kind: 'loose' };
  };

  const bump = (fn: () => void) => {
    if (Platform.OS !== 'web') void Haptics.selectionAsync();
    fn();
  };

  return (
    <View style={styles.list}>
      {tasks.map((task, index) => {
        const badge = badgeFor(task.captureId);
        const canUp = index > 0;
        const canDown = index < tasks.length - 1;

        return (
          <Pressable
            key={task.captureId}
            onPress={() => onAssignTask(task.captureId)}
            onLongPress={() => onMoveTask(task.captureId)}
            delayLongPress={320}
            style={({ pressed }) => [
              styles.taskRow,
              { backgroundColor: themeTaskBg },
              pressed && styles.taskRowPressed,
              index === 0 && tasks.length > 1 && styles.taskRowPriority,
            ]}
          >
            {tasks.length > 1 ? (
              <View style={styles.priorityCol}>
                <TouchableOpacity
                  onPress={() => canUp && bump(() => onMoveUp(task.captureId))}
                  disabled={!canUp}
                  style={[styles.priorityBtn, !canUp && styles.priorityBtnDisabled]}
                  accessibilityLabel={t('frentes.priorityUpA11y')}
                >
                  <ChevronUp size={16} color={canUp ? themeAccent : THEME.colors.text.tertiary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => canDown && bump(() => onMoveDown(task.captureId))}
                  disabled={!canDown}
                  style={[styles.priorityBtn, !canDown && styles.priorityBtnDisabled]}
                  accessibilityLabel={t('frentes.priorityDownA11y')}
                >
                  <ChevronDown
                    size={16}
                    color={canDown ? themeAccent : THEME.colors.text.tertiary}
                  />
                </TouchableOpacity>
              </View>
            ) : null}
            <View style={[styles.taskDot, { backgroundColor: themeAccent }]} />
            <View style={styles.taskBody}>
              <Text style={styles.taskText} numberOfLines={2}>
                {task.content}
              </Text>
              <View style={styles.taskMeta}>
                <Text
                  style={[
                    styles.badgePill,
                    badge.kind === 'loose' && styles.badgeLoose,
                    badge.kind === 'new' && styles.badgeNew,
                  ]}
                >
                  {badge.label}
                </Text>
                <TouchableOpacity
                  onPress={() => onMoveTask(task.captureId)}
                  style={styles.moveBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel={t('frentes.moveTaskA11y')}
                >
                  <ArrowRightLeft size={14} color={themeAccent} />
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
