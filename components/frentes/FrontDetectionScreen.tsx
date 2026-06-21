import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ChevronLeft, FolderPlus, Plus, Sparkles } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { AppLocale } from '@/lib/i18n';
import { buildCaptureFronts, type ProjectMeta } from '@/lib/captureProjectFronts';
import type { EnrichedCaptureItem } from '@/lib/taskIntelligentEnrichment';
import { applyFrontDeadlinesToItems } from '@/lib/captureFrontDiscovery';
import { FrontEditableGroupCard } from '@/components/frentes/FrontEditableGroupCard';
import { MoveTaskToFrenteSheet } from '@/components/frentes/MoveTaskToFrenteSheet';
import { CaptureItemAssignmentSheet } from '@/components/frentes/CaptureItemAssignmentSheet';
import { CreateFrenteModal } from '@/components/frentes/CreateFrenteModal';
import { CreateCustomGroupModal } from '@/components/frentes/CreateCustomGroupModal';
import { RenameGroupSheet } from '@/components/frentes/RenameGroupSheet';
import { AddStepToGroupSheet } from '@/components/frentes/AddStepToGroupSheet';
import {
  applyAssignmentKind,
  buildFrenteMoveTargets,
  findFrontForCaptureId,
  frontKeyForItem,
  getItemAssignmentKind,
  moveCaptureItemToFrontKey,
} from '@/lib/frentes/captureItemFront';
import { reorderCaptureItemsInFront } from '@/lib/frentes/reorderCapturePriority';
import {
  applyGroupDisplayOverrides,
  appendExtraMoveTargets,
  buildEmptyGroupFronts,
  createReviewCaptureItem,
  type GroupDisplayOverride,
} from '@/lib/frentes/reviewCaptureOrganization';
import { CaptureReviewDeadlinesSection } from '@/components/frentes/CaptureReviewDeadlinesSection';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { getFirstName } from '@/lib/displayName';
import type { CreatedProject } from '@/lib/createProject';

type FrontDetectionScreenProps = {
  locale: AppLocale;
  displayName: string;
  userId: string;
  items: EnrichedCaptureItem[];
  projects: ProjectMeta[];
  onItemsChange: (items: EnrichedCaptureItem[]) => void;
  onProjectsChange: (projects: ProjectMeta[]) => void;
  onProjectError?: (message: string) => void;
  onBack: () => void;
  onConfirm: (payload: {
    items: EnrichedCaptureItem[];
    frontDeadlines: Record<string, string | null>;
  }) => void;
  isSaving: boolean;
  isRefining?: boolean;
};

export function FrontDetectionScreen({
  locale,
  displayName,
  userId,
  items,
  projects,
  onItemsChange,
  onProjectsChange,
  onProjectError,
  onBack,
  onConfirm,
  isSaving,
  isRefining = false,
}: FrontDetectionScreenProps) {
  const { t } = useI18n();
  const firstName = getFirstName(displayName);
  const [groupOverrides, setGroupOverrides] = useState<Record<string, GroupDisplayOverride>>({});
  const [emptyGroupKeys, setEmptyGroupKeys] = useState<string[]>([]);
  const [frontDeadlines, setFrontDeadlines] = useState<Record<string, string | null>>({});
  const [moveTaskId, setMoveTaskId] = useState<string | null>(null);
  const [assignTaskId, setAssignTaskId] = useState<string | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [renameGroupKey, setRenameGroupKey] = useState<string | null>(null);
  const [addStepGroupKey, setAddStepGroupKey] = useState<string | null>(null);

  const frontsResult = useMemo(() => {
    const built = buildCaptureFronts(items, projects);
    const withOverrides = applyGroupDisplayOverrides(built.fronts, groupOverrides);
    const existingKeys = new Set(withOverrides.map((front) => front.key));
    const emptyFronts = buildEmptyGroupFronts(
      emptyGroupKeys.filter((key) => !existingKeys.has(key)),
      groupOverrides,
    );
    return {
      ...built,
      fronts: [...withOverrides, ...emptyFronts],
    };
  }, [emptyGroupKeys, groupOverrides, items, projects]);

  const moveTask = moveTaskId ? items.find((item) => item.id === moveTaskId) : null;
  const assignTask = assignTaskId ? items.find((item) => item.id === assignTaskId) : null;
  const moveTaskFront = moveTask
    ? findFrontForCaptureId(frontsResult.fronts, moveTask.id)
    : null;
  const assignTaskFront = assignTask
    ? findFrontForCaptureId(frontsResult.fronts, assignTask.id)
    : null;

  const renameFront = renameGroupKey
    ? frontsResult.fronts.find((front) => front.key === renameGroupKey)
    : null;
  const addStepFront = addStepGroupKey
    ? frontsResult.fronts.find((front) => front.key === addStepGroupKey)
    : null;

  const moveTargets = useMemo(() => {
    if (!moveTask) return [];
    const currentKey = moveTaskFront?.key ?? frontKeyForItem(moveTask, frontsResult.fronts);
    const base = buildFrenteMoveTargets(frontsResult.fronts, projects, currentKey);
    return appendExtraMoveTargets(base, emptyGroupKeys, groupOverrides, currentKey);
  }, [emptyGroupKeys, frontsResult.fronts, groupOverrides, moveTask, moveTaskFront?.key, projects]);

  const handleMoveToFrente = (targetKey: string) => {
    if (!moveTaskId) return;
    onItemsChange(moveCaptureItemToFrontKey(items, moveTaskId, targetKey, projects));
    setMoveTaskId(null);
  };

  const handleAssignment = (
    kind: Parameters<typeof applyAssignmentKind>[1],
    options?: { projectId?: string; frontKey?: string },
  ) => {
    if (!assignTaskId) return;
    onItemsChange(
      items.map((item) =>
        item.id === assignTaskId ? applyAssignmentKind(item, kind, options) : item,
      ),
    );
    setAssignTaskId(null);
  };

  const handleReorderPriority = (_frontKey: string, orderedCaptureIds: string[]) => {
    onItemsChange(reorderCaptureItemsInFront(items, orderedCaptureIds));
  };

  const handleCreateGroup = (payload: { key: string; name: string; emoji: string }) => {
    setGroupOverrides((prev) => ({
      ...prev,
      [payload.key]: { name: payload.name, emoji: payload.emoji },
    }));
    setEmptyGroupKeys((prev) => (prev.includes(payload.key) ? prev : [...prev, payload.key]));
  };

  const handleRenameGroup = (payload: { name: string; emoji: string }) => {
    if (!renameGroupKey) return;
    setGroupOverrides((prev) => ({
      ...prev,
      [renameGroupKey]: payload,
    }));
    setRenameGroupKey(null);
  };

  const handleAddStep = (content: string) => {
    if (!addStepGroupKey) return;
    const front = frontsResult.fronts.find((entry) => entry.key === addStepGroupKey);
    const projectList = projects.map((project) => ({ id: project.id, name: project.name }));
    const newItem = createReviewCaptureItem(content, {
      frontKey: addStepGroupKey,
      projects: projectList,
      createProjectOnSave: Boolean(front?.suggestedNewProject && !front.isExistingProject),
    });
    onItemsChange([...items, newItem]);
    setEmptyGroupKeys((prev) => prev.filter((key) => key !== addStepGroupKey));
    setAddStepGroupKey(null);
  };

  const handleProjectCreated = (project: CreatedProject) => {
    const next: ProjectMeta = {
      id: project.id,
      name: project.name,
      due_date: project.due_date ?? null,
    };
    onProjectsChange([...projects, next]);
    setShowCreateProject(false);
  };

  const handleConfirm = () => {
    const prepared = applyFrontDeadlinesToItems(items, frontsResult.fronts, frontDeadlines);
    onItemsChange(prepared);
    onConfirm({ items: prepared, frontDeadlines });
  };

  const taskCount = items.length;

  return (
    <View style={styles.wrap}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} accessibilityRole="button">
          <ChevronLeft size={22} color={THEME.colors.text.main} />
        </TouchableOpacity>
        <Sparkles size={20} color={THEME.colors.calm.lavenderDeep} />
      </View>

      <Animated.View entering={FadeInDown.duration(300)} style={styles.hero}>
        <Text style={styles.heroTitle}>
          {t('frentes.detectionTitle', { name: firstName })}
        </Text>
        <Text style={styles.heroSub}>
          {taskCount === 1
            ? t('frentes.detectionSubOne')
            : t('frentes.detectionSub', { count: taskCount })}
        </Text>
      </Animated.View>

      {isRefining ? (
        <View style={styles.refiningRow}>
          <ActivityIndicator size="small" color={THEME.colors.calm.lavenderDeep} />
          <Text style={styles.refiningText}>{t('vaciar.previewRefining')}</Text>
        </View>
      ) : null}

      <View style={styles.howToCard}>
        <Text style={styles.howToTitle}>{t('frentes.reviewHowToTitle')}</Text>
        <Text style={styles.howToBody}>{t('frentes.reviewHowToBody')}</Text>
      </View>

      <View style={styles.toolbar}>
        <TouchableOpacity
          style={styles.toolbarBtn}
          onPress={() => setShowCreateGroup(true)}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <Plus size={16} color={THEME.colors.calm.lavenderDeep} />
          <Text style={styles.toolbarBtnText}>{t('frentes.newGroup')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.toolbarBtn}
          onPress={() => setShowCreateProject(true)}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <FolderPlus size={16} color={THEME.colors.calm.lavenderDeep} />
          <Text style={styles.toolbarBtnText}>{t('frentes.newProject')}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionLabel}>{t('frentes.detectionFrentesHeading')}</Text>

      <View style={styles.frontList}>
        {frontsResult.fronts
          .filter((front) => front.tasks.length > 0)
          .map((front, index) => (
          <FrontEditableGroupCard
            key={front.key}
            front={front}
            items={items}
            projects={projects}
            index={index}
            onMoveTask={setMoveTaskId}
            onAssignTask={setAssignTaskId}
            onReorder={handleReorderPriority}
            onRenameGroup={() => setRenameGroupKey(front.key)}
            onAddStep={() => setAddStepGroupKey(front.key)}
          />
        ))}
      </View>

      <CaptureReviewDeadlinesSection
        locale={locale}
        fronts={frontsResult.fronts}
        projects={projects}
        frontDeadlines={frontDeadlines}
        onDeadlineChange={(frontKey, date) =>
          setFrontDeadlines((current) => ({ ...current, [frontKey]: date }))
        }
      />

      <View style={styles.supportCard}>
        <Sparkles size={18} color={THEME.colors.calm.lavenderDeep} />
        <Text style={styles.supportText}>{t('frentes.detectionSupport')}</Text>
      </View>

      <View style={styles.actions}>
        {isSaving ? (
          <ActivityIndicator color={THEME.colors.calm.lavenderDeep} />
        ) : (
          <CalmPrimaryButton
            label={t('frentes.createPlanCta')}
            onPress={handleConfirm}
            large
          />
        )}
        <TouchableOpacity onPress={onBack} style={styles.editLink} accessibilityRole="button">
          <Text style={styles.editLinkText}>{t('frentes.editBeforePlan')}</Text>
        </TouchableOpacity>
      </View>

      <MoveTaskToFrenteSheet
        visible={Boolean(moveTask)}
        taskTitle={moveTask?.content ?? ''}
        targets={moveTargets}
        onSelect={handleMoveToFrente}
        onClose={() => setMoveTaskId(null)}
      />

      <CaptureItemAssignmentSheet
        visible={Boolean(assignTask)}
        taskTitle={assignTask?.content ?? ''}
        currentKind={assignTask ? getItemAssignmentKind(assignTask) : 'loose'}
        selectedProjectId={assignTask?.selectedProjectId ?? null}
        suggestedFrontName={assignTaskFront?.name.replace(/\s+App$/i, '')}
        suggestedFrontKey={assignTaskFront?.key}
        projects={projects}
        onSelect={handleAssignment}
        onClose={() => setAssignTaskId(null)}
      />

      <CreateCustomGroupModal
        visible={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onCreate={handleCreateGroup}
      />

      <CreateFrenteModal
        visible={showCreateProject}
        userId={userId}
        locale={locale}
        existingNames={projects.map((project) => project.name)}
        onClose={() => setShowCreateProject(false)}
        onCreated={handleProjectCreated}
        onError={onProjectError}
      />

      <RenameGroupSheet
        visible={Boolean(renameFront)}
        initialName={renameFront?.name.replace(/\s+App$/i, '') ?? ''}
        initialEmoji={renameFront?.emoji ?? '✨'}
        onClose={() => setRenameGroupKey(null)}
        onSave={handleRenameGroup}
      />

      <AddStepToGroupSheet
        visible={Boolean(addStepFront)}
        groupName={addStepFront?.name.replace(/\s+App$/i, '') ?? ''}
        onClose={() => setAddStepGroupKey(null)}
        onAdd={handleAddStep}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.md,
    paddingBottom: THEME.spacing.xl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    minWidth: THEME.sizes.touchTarget,
    minHeight: THEME.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  hero: {
    gap: 6,
  },
  heroTitle: {
    ...THEME.typography.h2,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    lineHeight: 32,
  },
  heroSub: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
  },
  refiningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refiningText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
  },
  howToCard: {
    padding: THEME.spacing.md,
    borderRadius: 16,
    backgroundColor: THEME.colors.calm.mist,
    gap: 6,
  },
  howToTitle: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  howToBody: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
  },
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  toolbarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.lavender,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  toolbarBtnText: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.calm.lavenderDeep,
  },
  sectionLabel: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  frontList: {
    gap: 12,
  },
  supportCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: THEME.spacing.md,
    borderRadius: 20,
    backgroundColor: THEME.colors.calm.lavender,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  supportText: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    flex: 1,
    lineHeight: 20,
    fontFamily: THEME.fonts.heading.medium,
  },
  actions: {
    gap: THEME.spacing.sm,
    alignItems: 'center',
    marginTop: THEME.spacing.sm,
  },
  editLink: {
    paddingVertical: 10,
  },
  editLinkText: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    textDecorationLine: 'underline',
  },
});
