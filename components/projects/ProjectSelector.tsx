import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { THEME } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { FolderKanban, X, Plus, Calendar } from 'lucide-react-native';
import { useI18n } from '@/contexts/I18nContext';
import { ProjectCreateForm } from '@/components/projects/ProjectCreateForm';
import { PROJECT_COLORS } from '@/lib/projectColors';
import { createProjectForUser, createProjectErrorMessage } from '@/lib/createProject';
import { formatProjectDueDate } from '@/lib/projectProgress';

interface Project {
  id: string;
  name: string;
  color: string;
  due_date?: string | null;
}

interface ProjectSelectorProps {
  selectedProjectId: string | null;
  onSelect: (projectId: string | null) => void;
  userId: string;
  onBeforeOpenModal?: () => void;
  showLabel?: boolean;
  onError?: (message: string) => void;
  onSuccess?: (projectName: string) => void;
  /** En captura: el modal prioriza elegir o crear proyecto; «sin proyecto» sigue disponible arriba. */
  assignMode?: boolean;
}

export function ProjectSelector({
  selectedProjectId,
  onSelect,
  userId,
  onBeforeOpenModal,
  showLabel = true,
  onError,
  onSuccess,
  assignMode = false,
}: ProjectSelectorProps) {
  const { t, locale } = useI18n();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState<string>(PROJECT_COLORS[0]);
  const [newDueDate, setNewDueDate] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [keyboardPad, setKeyboardPad] = useState(0);

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvt, (e) => setKeyboardPad(e.endCoordinates.height));
    const hideSub = Keyboard.addListener(hideEvt, () => setKeyboardPad(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const loadProjects = useCallback(async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, color, due_date')
      .eq('user_id', userId)
      .order('priority', { ascending: false });
    if (error) {
      setProjects([]);
      return;
    }
    setProjects(data || []);
  }, [userId]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        await loadProjects();
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [userId, loadProjects]);

  const handleCreateProject = async () => {
    setSaving(true);
    setFormError(null);
    const result = await createProjectForUser({
      userId,
      name: newName,
      color: newColor,
      dueDateRaw: newDueDate,
      existingNames: projects.map((p) => p.name),
      locale,
    });
    setSaving(false);

    if (!result.ok) {
      const message = createProjectErrorMessage(result.reason, locale);
      setFormError(message);
      onError?.(message);
      return;
    }

    const data = result.project;
    setProjects((prev) => [data, ...prev]);
    onSelect(data.id);
    setNewName('');
    setNewColor(PROJECT_COLORS[0]);
    setNewDueDate('');
    setFormError(null);
    setShowNewProject(false);
    setShowModal(false);
    onSuccess?.(data.name);
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const selectedDueLabel = selectedProject
    ? formatProjectDueDate(selectedProject.due_date ?? null, locale)
    : null;

  const closeModal = () => {
    Keyboard.dismiss();
    setShowModal(false);
  };

  return (
    <View style={styles.container}>
      {showLabel ? <Text style={styles.label}>{t('projectSelectorExtra.optionalLabel')}</Text> : null}
      <TouchableOpacity
        style={[styles.selector, selectedProject && styles.selectorWithProject]}
        onPress={() => {
          Keyboard.dismiss();
          onBeforeOpenModal?.();
          setShowModal(true);
        }}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={
          selectedProject
            ? t('projectSelectorExtra.a11ySelector', { name: selectedProject.name })
            : t('projectSelectorExtra.a11yChooseOptional')
        }
      >
        {selectedProject ? (
          <View style={[styles.selectedRow, styles.selectedRowProject]}>
            <View
              style={[
                styles.colorBar,
                { backgroundColor: selectedProject.color || THEME.colors.gradient.blue },
              ]}
            />
            <View style={styles.selectedProjectInfo}>
              <Text style={styles.selectedProjectLabel}>{t('projectSelectorExtra.label')}</Text>
              <Text style={styles.selectorText}>{selectedProject.name}</Text>
              {selectedDueLabel ? (
                <View style={styles.dueRow}>
                  <Calendar size={12} color={THEME.colors.text.secondary} />
                  <Text style={styles.dueText}>
                    {t('projectsUi.dueDate', { date: selectedDueLabel })}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : (
          <View style={styles.selectedRow}>
            <FolderKanban size={20} color={THEME.colors.gradient.blue} />
            <View style={styles.placeholderWrap}>
              <Text style={[styles.selectorText, styles.placeholderText]}>
                {t('projectSelectorExtra.chooseOptional')}
              </Text>
              <Text style={styles.placeholderSub}>{t('projectSelectorExtra.chooseOptionalSub')}</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
        onShow={() => {
          Keyboard.dismiss();
          setShowNewProject(false);
          setNewName('');
          setNewDueDate('');
          setFormError(null);
        }}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeModal}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
            style={styles.modalKeyboardWrap}
          >
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {assignMode ? t('components.chooseProject') : t('components.projectModalAssign')}
                </Text>
                <TouchableOpacity
                  onPress={closeModal}
                  style={styles.modalClose}
                  accessibilityLabel={t('components.closeA11y')}
                >
                  <X size={24} color={THEME.colors.text.main} />
                </TouchableOpacity>
              </View>
              <ScrollView
                style={styles.modalListScroll}
                contentContainerStyle={[
                  styles.modalListContent,
                  {
                    paddingBottom:
                      keyboardPad > 0 ? keyboardPad + THEME.spacing.md : THEME.spacing.lg,
                  },
                ]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
              >
                <Text style={styles.modalSectionHint}>{t('projectSelectorExtra.modalHint')}</Text>

                <TouchableOpacity
                  style={[
                    styles.optionRow,
                    styles.optionRowFirst,
                    selectedProjectId == null && styles.optionRowSelected,
                  ]}
                  onPress={() => {
                    onSelect(null);
                    closeModal();
                  }}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={t('projectSelectorExtra.a11yLooseOption')}
                  accessibilityState={{ selected: selectedProjectId == null }}
                >
                  <FolderKanban
                    size={22}
                    color={
                      selectedProjectId == null
                        ? THEME.colors.gradient.blue
                        : THEME.colors.text.secondary
                    }
                  />
                  <View style={styles.optionTextWrap}>
                    <Text
                      style={[
                        styles.optionText,
                        selectedProjectId == null && styles.optionTextSelected,
                      ]}
                    >
                      {t('components.looseTasks')}
                    </Text>
                    <Text
                      style={[
                        styles.optionSubtext,
                        selectedProjectId == null && styles.optionSubtextOnSelected,
                      ]}
                    >
                      {t('projectSelectorExtra.noProjectShort')}
                    </Text>
                  </View>
                  {selectedProjectId == null ? <Text style={styles.optionCheck}>✓</Text> : null}
                </TouchableOpacity>

                {loading ? (
                  <Text style={styles.loadingText}>{t('components.loadingProjects')}</Text>
                ) : (
                  <>
                    {projects.length > 0 ? (
                      <Text style={styles.modalSectionTitle}>{t('projectSelectorExtra.myProjects')}</Text>
                    ) : null}
                    {projects.map((p) => {
                      const selected = selectedProjectId === p.id;
                      const dueLabel = formatProjectDueDate(p.due_date ?? null, locale);
                      return (
                        <TouchableOpacity
                          key={p.id}
                          style={[styles.optionRow, selected && styles.optionRowSelected]}
                          onPress={() => {
                            onSelect(p.id);
                            closeModal();
                          }}
                          activeOpacity={0.7}
                          accessibilityRole="button"
                          accessibilityLabel={t('projectSelectorExtra.a11ySelector', { name: p.name })}
                          accessibilityState={{ selected }}
                        >
                          <View
                            style={[
                              styles.colorDot,
                              styles.colorDotRing,
                              selected && styles.colorDotRingSelected,
                              { backgroundColor: p.color || THEME.colors.gradient.blue },
                            ]}
                          />
                          <View style={styles.optionTextWrap}>
                            <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                              {p.name}
                            </Text>
                            {dueLabel ? (
                              <Text style={styles.optionSubtext}>
                                {t('projectsUi.dueDate', { date: dueLabel })}
                              </Text>
                            ) : null}
                          </View>
                          {selected ? <Text style={styles.optionCheck}>✓</Text> : null}
                        </TouchableOpacity>
                      );
                    })}

                    {showNewProject ? (
                      <View style={styles.newProjectForm}>
                        <ProjectCreateForm
                          name={newName}
                          color={newColor}
                          dueDate={newDueDate}
                          error={formError}
                          saving={saving}
                          onNameChange={(v) => {
                            setNewName(v);
                            if (formError) setFormError(null);
                          }}
                          onColorChange={setNewColor}
                          onDueDateChange={setNewDueDate}
                          onCancel={() => {
                            setShowNewProject(false);
                            setNewName('');
                            setNewDueDate('');
                            Keyboard.dismiss();
                          }}
                          onSubmit={() => void handleCreateProject()}
                        />
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.addProjectRow}
                        onPress={() => {
                          setShowNewProject(true);
                          setFormError(null);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={t('projectSelectorExtra.createNew')}
                      >
                        <Plus size={20} color={THEME.colors.gradient.blue} />
                        <View style={styles.addProjectTextWrap}>
                          <Text style={styles.addProjectText}>{t('projectSelectorExtra.createNew')}</Text>
                          <Text style={styles.addProjectSub}>{t('projects.createProjectFormHint')}</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  label: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.xs,
  },
  selector: {
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
    minHeight: THEME.sizes.touchTarget,
  },
  selectorWithProject: {
    paddingLeft: THEME.spacing.xs,
  },
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  selectedRowProject: {
    alignItems: 'stretch',
    gap: 0,
  },
  colorBar: {
    width: 4,
    borderRadius: 2,
    marginRight: THEME.spacing.sm,
    minHeight: 40,
  },
  selectedProjectInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  selectedProjectLabel: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
  },
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  dueText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  selectorText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
  },
  placeholderWrap: {
    flex: 1,
    gap: 2,
  },
  placeholderText: {
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
  },
  placeholderSub: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: THEME.colors.overlayLight,
    justifyContent: 'flex-end',
  },
  modalKeyboardWrap: {
    maxHeight: '92%',
  },
  modalContent: {
    backgroundColor: THEME.colors.fill[100],
    borderTopLeftRadius: THEME.borderRadius.rounded * 2,
    borderTopRightRadius: THEME.borderRadius.rounded * 2,
    maxHeight: '92%',
  },
  modalSectionHint: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.xs,
    lineHeight: 18,
  },
  modalSectionTitle: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.secondary,
    marginTop: THEME.spacing.md,
    marginBottom: THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.xs,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: THEME.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.stroke[100],
  },
  modalTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
  },
  modalClose: {
    padding: THEME.spacing.xs,
  },
  modalListScroll: {
    maxHeight: 520,
  },
  modalListContent: {
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.xs,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.standard,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionRowSelected: {
    backgroundColor: THEME.colors.tint.blue.veryLight,
    borderColor: THEME.colors.gradient.blue,
  },
  optionRowFirst: {
    backgroundColor: THEME.colors.fill[200],
  },
  optionTextWrap: {
    flex: 1,
  },
  optionText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
  },
  optionTextSelected: {
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
  },
  optionSubtext: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    marginTop: 2,
  },
  optionSubtextOnSelected: {
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.medium,
  },
  colorDotRing: {
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotRingSelected: {
    borderColor: THEME.colors.gradient.blue,
  },
  optionCheck: {
    ...THEME.typography.body,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
  },
  loadingText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    padding: THEME.spacing.md,
  },
  addProjectRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.sm,
    marginTop: THEME.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.stroke[100],
    minHeight: THEME.sizes.touchTarget,
  },
  addProjectTextWrap: {
    flex: 1,
    gap: 2,
  },
  addProjectText: {
    ...THEME.typography.body,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.medium,
  },
  addProjectSub: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  newProjectForm: {
    marginTop: THEME.spacing.md,
    padding: THEME.spacing.md,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
  },
});
