import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { TaskCaptureOrganize } from '@/components/tasks/TaskCaptureOrganize';
import type { VaciarBatchItem } from '@/lib/vaciarBatchDraft';
import type { TaskEffort } from '@/lib/taskPerceivedEffort';

type TaskBatchEditorProps = {
  userId: string;
  items: VaciarBatchItem[];
  expandedId: string | null;
  onExpandedIdChange: (id: string | null) => void;
  onItemsChange: (items: VaciarBatchItem[]) => void;
  optionalProjectId: string | null;
  optionalProjectName: string | null;
  projectNamesById?: Record<string, string>;
  onAssignAllToProject: () => void;
  onCancel: () => void;
  onSave: () => void;
  isSaving: boolean;
  formatDate: (iso: string | null) => string;
  onProjectError: (message: string) => void;
  onProjectCreated: (name: string) => void;
};

function summarizeItem(
  item: VaciarBatchItem,
  t: (key: string, params?: Record<string, string | number>) => string,
  formatDate: (iso: string | null) => string,
  projectNamesById?: Record<string, string>,
): string {
  const parts: string[] = [];
  if (item.assignToProject && item.selectedProjectId) {
    const projectName = projectNamesById?.[item.selectedProjectId];
    parts.push(
      projectName
        ? t('vaciar.batchSummaryProjectName', { name: projectName })
        : t('vaciar.batchSummaryProject'),
    );
  } else {
    parts.push(t(`categories.${item.selectedCategory}`));
  }
  parts.push(item.selectedDate ? formatDate(item.selectedDate) : t('vaciar.aiPreviewNoDate'));
  if (item.effortFeel === 'light') parts.push(t('vaciar.effortLight'));
  else if (item.effortFeel === 'heavy') parts.push(t('vaciar.effortHeavy'));
  else if (item.effortFeel === 'medium') parts.push(t('vaciar.effortMedium'));
  return parts.join(' · ');
}

export function TaskBatchEditor({
  userId,
  items,
  expandedId,
  onExpandedIdChange,
  onItemsChange,
  optionalProjectId,
  optionalProjectName,
  projectNamesById,
  onAssignAllToProject,
  onCancel,
  onSave,
  isSaving,
  formatDate,
  onProjectError,
  onProjectCreated,
}: TaskBatchEditorProps) {
  const { t } = useI18n();

  const updateItem = (id: string, patch: Partial<VaciarBatchItem>) => {
    onItemsChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const toggleExpanded = (id: string) => {
    onExpandedIdChange(expandedId === id ? null : id);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <Sparkles size={16} color={THEME.colors.calm.lavenderDeep} />
          <Text style={styles.title}>{t('vaciar.batchEditorTitle', { count: items.length })}</Text>
        </View>
        <Text style={styles.subtitle}>{t('vaciar.batchEditorSubtitle')}</Text>

        {optionalProjectId ? (
          <TouchableOpacity
            style={styles.applyAllBtn}
            onPress={onAssignAllToProject}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={t('vaciar.batchAssignProjectAllA11y')}
          >
            <Text style={styles.applyAllText}>
              {optionalProjectName
                ? t('vaciar.batchAssignProjectAll', { name: optionalProjectName })
                : t('vaciar.batchAssignProjectAllGeneric')}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {items.map((item, index) => {
        const expanded = expandedId === item.id;
        return (
          <View key={item.id} style={styles.itemCard}>
            <TouchableOpacity
              style={styles.itemHeader}
              onPress={() => toggleExpanded(item.id)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t('vaciar.batchItemA11y', { n: index + 1, task: item.content })}
            >
              <View style={styles.itemHeaderText}>
                <Text style={styles.itemContent} numberOfLines={expanded ? undefined : 2}>
                  {item.content}
                </Text>
                {!expanded ? (
                  <Text style={styles.itemSummary}>
                    {summarizeItem(item, t, formatDate, projectNamesById)}
                  </Text>
                ) : (
                  <Text style={styles.adjustHint}>{t('vaciar.batchAdjustHint')}</Text>
                )}
              </View>
              {expanded ? (
                <ChevronUp size={20} color={THEME.colors.calm.lavenderDeep} />
              ) : (
                <ChevronDown size={20} color={THEME.colors.calm.lavenderDeep} />
              )}
            </TouchableOpacity>

            {expanded ? (
              <View style={styles.itemBody}>
                <TextInput
                  style={styles.editInput}
                  value={item.content}
                  onChangeText={(text) => updateItem(item.id, { content: text })}
                  multiline
                  maxLength={300}
                  placeholderTextColor={THEME.colors.text.tertiary}
                />
                <TaskCaptureOrganize
                  embedded
                  userId={userId}
                  taskTitle={item.content}
                  assignToProject={item.assignToProject}
                  onAssignToProjectChange={(value) =>
                    updateItem(item.id, {
                      assignToProject: value,
                      selectedProjectId: value ? item.selectedProjectId : null,
                    })
                  }
                  selectedCategory={item.selectedCategory}
                  onCategoryChange={(key) => updateItem(item.id, { selectedCategory: key })}
                  selectedProjectId={item.selectedProjectId}
                  onProjectChange={(id) => updateItem(item.id, { selectedProjectId: id })}
                  selectedDate={item.selectedDate}
                  onDateChange={(date) => updateItem(item.id, { selectedDate: date })}
                  hasSubtasks={false}
                  onHasSubtasksChange={() => {}}
                  subtasks={[]}
                  onSubtasksChange={() => {}}
                  onAddSubtask={() => {}}
                  onRemoveSubtask={() => {}}
                  onProjectError={onProjectError}
                  onProjectCreated={onProjectCreated}
                  effortFeel={item.effortFeel}
                  onEffortChange={(value: TaskEffort | null) =>
                    updateItem(item.id, { effortFeel: value })
                  }
                />
              </View>
            ) : null}
          </View>
        );
      })}

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={onCancel}
          style={styles.cancelBtn}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t('vaciar.batchCancelA11y')}
        >
          <Text style={styles.cancelText}>{t('vaciar.batchBackToEdit')}</Text>
        </TouchableOpacity>
        <CalmPrimaryButton
          label={t('vaciar.batchPreviewConfirm', { count: items.length })}
          onPress={onSave}
          loading={isSaving}
          disabled={isSaving}
          large
          style={styles.saveBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.sm,
    alignSelf: 'stretch',
  },
  headerCard: {
    ...THEME.surfaces.elevated,
    padding: THEME.spacing.md,
    gap: THEME.spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    flex: 1,
  },
  subtitle: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
  },
  applyAllBtn: {
    alignSelf: 'flex-start',
    marginTop: THEME.spacing.xs,
    paddingVertical: 8,
    paddingHorizontal: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.mist,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  applyAllText: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.secondary,
  },
  itemCard: {
    ...THEME.surfaces.elevated,
    overflow: 'hidden',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
    padding: THEME.spacing.md,
  },
  itemHeaderText: {
    flex: 1,
    gap: 6,
  },
  itemContent: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
    lineHeight: 22,
  },
  itemSummary: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    lineHeight: 18,
  },
  adjustHint: {
    ...THEME.typography.meta,
    color: THEME.colors.text.tertiary,
  },
  itemBody: {
    paddingHorizontal: THEME.spacing.md,
    paddingBottom: THEME.spacing.md,
    gap: THEME.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.calm.border,
  },
  editInput: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    backgroundColor: THEME.colors.calm.mist,
    borderRadius: THEME.borderRadius.standard,
    padding: THEME.spacing.sm,
    minHeight: 48,
    textAlignVertical: 'top',
  },
  actions: {
    gap: THEME.spacing.sm,
    paddingTop: THEME.spacing.xs,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: THEME.spacing.sm,
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
  },
  cancelText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
  },
  saveBtn: {
    alignSelf: 'stretch',
  },
});
