import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Plus } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { CaptureFront, ProjectMeta } from '@/lib/captureProjectFronts';
import type { EnrichedCaptureItem } from '@/lib/taskIntelligentEnrichment';
import { frontThemeForFront } from '@/lib/frentes/frontTheme';
import { FrontTaskList } from '@/components/frentes/CaptureProjectsSection';

type FrontEditableGroupCardProps = {
  front: CaptureFront;
  items: EnrichedCaptureItem[];
  projects: ProjectMeta[];
  index?: number;
  onMoveTask: (captureId: string) => void;
  onAssignTask: (captureId: string) => void;
  onReorder: (frontKey: string, orderedCaptureIds: string[]) => void;
  onRenameGroup?: () => void;
  onAddStep?: () => void;
};

export function FrontEditableGroupCard({
  front,
  items,
  projects,
  index = 0,
  onMoveTask,
  onAssignTask,
  onReorder,
  onRenameGroup,
  onAddStep,
}: FrontEditableGroupCardProps) {
  const { t } = useI18n();
  const theme = frontThemeForFront(front, index);
  const displayName = front.name.replace(/\s+App$/i, '');

  const handleMove = (captureId: string, direction: 'up' | 'down') => {
    const orderedIds = front.tasks.map((task) => task.captureId);
    const index = orderedIds.indexOf(captureId);
    if (index < 0) return;
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= orderedIds.length) return;
    const next = [...orderedIds];
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    onReorder(front.key, next);
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 55).duration(320).springify().damping(20)}
      style={[styles.card, { backgroundColor: theme.bg, borderColor: theme.border }]}
    >
      <TouchableOpacity
        style={styles.header}
        onPress={onRenameGroup}
        disabled={!onRenameGroup}
        activeOpacity={onRenameGroup ? 0.75 : 1}
        accessibilityRole={onRenameGroup ? 'button' : undefined}
        accessibilityLabel={onRenameGroup ? t('frentes.renameGroupA11y') : undefined}
      >
        <Text style={styles.emoji}>{front.emoji}</Text>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: theme.accent }]}>{displayName}</Text>
          {front.suggestedNewProject && !front.isExistingProject ? (
            <Text style={styles.newProjectHint}>{t('frentes.suggestedNewProject')}</Text>
          ) : onRenameGroup ? (
            <Text style={styles.renameHint}>{t('frentes.renameGroupHint')}</Text>
          ) : null}
        </View>
        <Text style={styles.badge}>
          {front.tasks.length === 1 ? '1' : front.tasks.length}
        </Text>
      </TouchableOpacity>

      {front.tasks.length === 0 ? (
        <Text style={styles.emptyHint}>{t('frentes.emptyGroupHint')}</Text>
      ) : null}

      <FrontTaskList
        tasks={front.tasks}
        themeAccent={theme.accent}
        themeTaskBg={theme.taskBg}
        items={items}
        projects={projects}
        displayName={displayName}
        onMoveTask={onMoveTask}
        onAssignTask={onAssignTask}
        onMoveUp={(id) => handleMove(id, 'up')}
        onMoveDown={(id) => handleMove(id, 'down')}
      />

      {onAddStep ? (
        <TouchableOpacity
          style={[styles.addStepBtn, { borderColor: theme.border }]}
          onPress={onAddStep}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t('frentes.addStepA11y')}
        >
          <Plus size={16} color={theme.accent} />
          <Text style={[styles.addStepText, { color: theme.accent }]}>{t('frentes.addStep')}</Text>
        </TouchableOpacity>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: THEME.spacing.md,
    gap: THEME.spacing.sm,
    ...THEME.shadows.soft,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  emoji: {
    fontSize: THEME.typography.displayEmojiMd.fontSize,
    lineHeight: 26,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    lineHeight: 22,
  },
  newProjectHint: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
  },
  badge: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.secondary,
    backgroundColor: THEME.colors.surfaceOverlay.glassHeavy,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: THEME.borderRadius.pill,
    overflow: 'hidden',
  },
  renameHint: {
    ...THEME.typography.meta,
    color: THEME.colors.text.tertiary,
  },
  emptyHint: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  addStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addStepText: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.medium,
  },
});
