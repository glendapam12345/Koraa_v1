import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME } from '@/constants/theme';
import { FolderKanban, X, Calendar, ChevronLeft, Plus, ChevronRight } from 'lucide-react-native';
import { useI18n } from '@/contexts/I18nContext';
import { ProjectCreateForm } from '@/components/projects/ProjectCreateForm';
import { ProjectCreateStepsOverview } from '@/components/projects/ProjectCreateStepsOverview';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { PROJECT_COLORS } from '@/lib/projectColors';
import { createProjectForUser, createProjectErrorMessage } from '@/lib/createProject';
import type { LifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';
import { inferLifeAreaKeyForProject } from '@/lib/lifeAreas/lifeAreaCatalog';
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
  assignMode?: boolean;
  requestOpen?: boolean;
  onRequestOpenHandled?: () => void;
  requestCreate?: boolean;
  onRequestCreateHandled?: () => void;
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
  requestOpen = false,
  onRequestOpenHandled,
  requestCreate = false,
  onRequestCreateHandled,
}: ProjectSelectorProps) {
  const { t, locale } = useI18n();
  const insets = useSafeAreaInsets();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState<'list' | 'create'>('list');
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState<string>(PROJECT_COLORS[0]);
  const [newDueDate, setNewDueDate] = useState('');
  const [newLifeAreaKey, setNewLifeAreaKey] = useState<LifeAreaRef>('other');
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

  useEffect(() => {
    if (!requestOpen) return;
    setShowModal(true);
    setModalStep('list');
    onRequestOpenHandled?.();
  }, [requestOpen, onRequestOpenHandled]);

  useEffect(() => {
    if (!requestCreate) return;
    setShowModal(true);
    setModalStep('create');
    onRequestCreateHandled?.();
  }, [requestCreate, onRequestCreateHandled]);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const { fetchUserProjects } = await import('@/lib/projectDueDateSchema');
      const { data, error } = await fetchUserProjects(userId);
      if (error) {
        setProjects([]);
        return;
      }
      setProjects(data);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadProjects();
  }, [userId, loadProjects]);

  const openModal = () => {
    Keyboard.dismiss();
    onBeforeOpenModal?.();
    setModalStep('list');
    setShowModal(true);
    void loadProjects();
  };

  const handleCreateProject = async () => {
    setSaving(true);
    setFormError(null);
    const result = await createProjectForUser({
      userId,
      name: newName,
      color: newColor,
      dueDateRaw: newDueDate,
      lifeAreaKey: newLifeAreaKey,
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
    setNewLifeAreaKey('other');
    setFormError(null);
    setModalStep('list');
    setShowModal(false);
    onSuccess?.(data.name);
  };

  const openCreateStep = () => {
    setFormError(null);
    setNewName('');
    setNewDueDate('');
    setNewLifeAreaKey('other');
    setNewColor(PROJECT_COLORS[0]);
    setModalStep('create');
  };

  const backToList = () => {
    setModalStep('list');
    setFormError(null);
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const selectedDueLabel = selectedProject
    ? formatProjectDueDate(selectedProject.due_date ?? null, locale)
    : null;

  const closeModal = () => {
    Keyboard.dismiss();
    setModalStep('list');
    setShowModal(false);
  };

  const listTitle = assignMode
    ? t('projectSelectorExtra.captureSheetTitle')
    : t('components.projectModalAssign');

  const listSubtitle = assignMode
    ? t('projectSelectorExtra.captureSheetSub')
    : t('projectSelectorExtra.modalHint');

  return (
    <View style={styles.container}>
      {showLabel ? <Text style={styles.label}>{t('projectSelectorExtra.optionalLabel')}</Text> : null}
      <TouchableOpacity
        style={[
          styles.selector,
          assignMode && !selectedProject && styles.selectorAssignEmpty,
          selectedProject && styles.selectorWithProject,
        ]}
        onPress={openModal}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={
          selectedProject
            ? t('projectSelectorExtra.a11ySelector', { name: selectedProject.name })
            : assignMode
              ? t('projectSelectorExtra.a11yChooseProject')
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
            <ChevronRight size={18} color={THEME.colors.text.secondary} />
          </View>
        ) : (
          <View style={styles.selectedRow}>
            <View style={styles.placeholderIcon}>
              <FolderKanban size={20} color={THEME.colors.calm.lavenderDeep} />
            </View>
            <View style={styles.placeholderWrap}>
              <Text style={[styles.selectorText, styles.placeholderText]}>
                {assignMode
                  ? t('projectSelectorExtra.chooseProjectPrompt')
                  : t('projectSelectorExtra.chooseOptional')}
              </Text>
              <Text style={styles.placeholderSub}>
                {assignMode
                  ? t('projectSelectorExtra.chooseProjectSub')
                  : t('projectSelectorExtra.chooseOptionalSub')}
              </Text>
            </View>
            <ChevronRight size={18} color={THEME.colors.calm.lavenderDeep} />
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
          setNewName('');
          setNewDueDate('');
    setNewLifeAreaKey('other');
          setNewColor(PROJECT_COLORS[0]);
          setFormError(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={closeModal} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalKeyboardWrap}
          >
            <View
              style={[
                styles.modalSheet,
                { paddingBottom: Math.max(insets.bottom, THEME.spacing.md) },
              ]}
            >
              <View style={styles.sheetHandle} />

              <View style={styles.modalHeader}>
                {modalStep === 'create' ? (
                  <TouchableOpacity
                    onPress={backToList}
                    style={styles.modalIconBtn}
                    accessibilityRole="button"
                    accessibilityLabel={t('projects.backToProjectList')}
                  >
                    <ChevronLeft size={24} color={THEME.colors.text.main} />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.modalIconSpacer} />
                )}
                <View style={styles.modalTitleWrap}>
                  <Text style={styles.modalTitle} numberOfLines={1}>
                    {modalStep === 'create'
                      ? t('projectSelectorExtra.newTitle')
                      : listTitle}
                  </Text>
                  {modalStep === 'list' ? (
                    <Text style={styles.modalSubtitle} numberOfLines={2}>
                      {listSubtitle}
                    </Text>
                  ) : (
                    <Text style={styles.modalSubtitle} numberOfLines={2}>
                      {t('projects.createProjectFormHint')}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={closeModal}
                  style={styles.modalIconBtn}
                  accessibilityLabel={t('components.closeA11y')}
                >
                  <X size={22} color={THEME.colors.text.main} />
                </TouchableOpacity>
              </View>

              {modalStep === 'create' ? <ProjectCreateStepsOverview /> : null}

              {modalStep === 'create' ? (
                <View style={styles.createStep}>
                  <ScrollView
                    style={styles.createScroll}
                    contentContainerStyle={[
                      styles.createScrollContent,
                      {
                        paddingBottom:
                          Math.max(insets.bottom, THEME.spacing.md) +
                          (keyboardPad > 0
                            ? keyboardPad - insets.bottom + THEME.spacing.sm
                            : THEME.spacing.lg),
                      },
                    ]}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="interactive"
                    showsVerticalScrollIndicator
                  >
                    <ProjectCreateForm
                      embedded
                      hideFooter
                      name={newName}
                      color={newColor}
                      dueDate={newDueDate}
                      lifeAreaKey={newLifeAreaKey}
                      error={formError}
                      saving={saving}
                      onNameChange={(v) => {
                        setNewName(v);
                        if (v.trim()) setNewLifeAreaKey(inferLifeAreaKeyForProject(v));
                        if (formError) setFormError(null);
                      }}
                      onColorChange={setNewColor}
                      onDueDateChange={setNewDueDate}
                      onLifeAreaChange={setNewLifeAreaKey}
                      onCancel={backToList}
                      onSubmit={() => void handleCreateProject()}
                    />

                    {formError ? <Text style={styles.createFooterError}>{formError}</Text> : null}

                    <CalmPrimaryButton
                      label={
                        saving ? t('components.creatingProject') : t('components.createProject')
                      }
                      onPress={() => void handleCreateProject()}
                      loading={saving}
                      disabled={!newName.trim() || saving}
                      large
                      style={styles.createSubmitBtn}
                    />
                  </ScrollView>
                </View>
              ) : (
                <ScrollView
                  style={styles.modalListScroll}
                  contentContainerStyle={styles.modalListContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <TouchableOpacity
                    style={styles.createCard}
                    onPress={openCreateStep}
                    activeOpacity={0.88}
                    accessibilityRole="button"
                    accessibilityLabel={t('projectSelectorExtra.createNew')}
                  >
                    <View style={styles.createCardIcon}>
                      <Plus size={22} color={THEME.colors.calm.lavenderDeep} strokeWidth={2.2} />
                    </View>
                    <View style={styles.createCardText}>
                      <Text style={styles.createCardTitle}>{t('projectSelectorExtra.createNew')}</Text>
                      <Text style={styles.createCardSub}>{t('projectSelectorExtra.createNewSub')}</Text>
                    </View>
                    <ChevronRight size={20} color={THEME.colors.calm.lavenderDeep} />
                  </TouchableOpacity>

                  {!assignMode ? (
                    <TouchableOpacity
                      style={[
                        styles.projectCard,
                        selectedProjectId == null && styles.projectCardSelected,
                      ]}
                      onPress={() => {
                        onSelect(null);
                        closeModal();
                      }}
                      activeOpacity={0.88}
                      accessibilityRole="button"
                      accessibilityLabel={t('projectSelectorExtra.a11yLooseOption')}
                      accessibilityState={{ selected: selectedProjectId == null }}
                    >
                      <View style={[styles.projectCardBar, styles.looseBar]} />
                      <View style={styles.projectCardBody}>
                        <Text
                          style={[
                            styles.projectCardName,
                            selectedProjectId == null && styles.projectCardNameSelected,
                          ]}
                        >
                          {t('components.looseTasks')}
                        </Text>
                        <Text style={styles.projectCardMeta}>
                          {t('projectSelectorExtra.noProjectShort')}
                        </Text>
                      </View>
                      {selectedProjectId == null ? (
                        <Text style={styles.projectCardCheck}>✓</Text>
                      ) : (
                        <ChevronRight size={18} color={THEME.colors.text.secondary} />
                      )}
                    </TouchableOpacity>
                  ) : null}

                  {loading ? (
                    <View style={styles.loadingWrap}>
                      <ActivityIndicator color={THEME.colors.calm.lavenderDeep} />
                      <Text style={styles.loadingText}>{t('components.loadingProjects')}</Text>
                    </View>
                  ) : projects.length > 0 ? (
                    <>
                      <Text style={styles.listSectionLabel}>
                        {assignMode
                          ? t('projectSelectorExtra.existingProjects')
                          : t('projectSelectorExtra.myProjects')}
                      </Text>
                      {projects.map((p) => {
                        const selected = selectedProjectId === p.id;
                        const dueLabel = formatProjectDueDate(p.due_date ?? null, locale);
                        return (
                          <TouchableOpacity
                            key={p.id}
                            style={[styles.projectCard, selected && styles.projectCardSelected]}
                            onPress={() => {
                              onSelect(p.id);
                              closeModal();
                            }}
                            activeOpacity={0.88}
                            accessibilityRole="button"
                            accessibilityLabel={t('projectSelectorExtra.a11ySelector', {
                              name: p.name,
                            })}
                            accessibilityState={{ selected }}
                          >
                            <View
                              style={[
                                styles.projectCardBar,
                                { backgroundColor: p.color || THEME.colors.gradient.blue },
                              ]}
                            />
                            <View style={styles.projectCardBody}>
                              <Text
                                style={[
                                  styles.projectCardName,
                                  selected && styles.projectCardNameSelected,
                                ]}
                              >
                                {p.name}
                              </Text>
                              {dueLabel ? (
                                <Text style={styles.projectCardMeta}>
                                  {t('projectsUi.dueDate', { date: dueLabel })}
                                </Text>
                              ) : null}
                            </View>
                            {selected ? (
                              <Text style={styles.projectCardCheck}>✓</Text>
                            ) : (
                              <ChevronRight size={18} color={THEME.colors.text.secondary} />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </>
                  ) : (
                    <View style={styles.emptyWrap}>
                      <Text style={styles.emptyText}>{t('projectSelectorExtra.noProjectsYet')}</Text>
                    </View>
                  )}
                </ScrollView>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
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
    backgroundColor: THEME.colors.calm.card,
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    minHeight: THEME.sizes.touchTarget,
    ...THEME.shadows.soft,
  },
  selectorAssignEmpty: {
    backgroundColor: THEME.colors.calm.mist,
    borderColor: THEME.colors.calm.border,
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
  placeholderIcon: {
    width: 40,
    height: 40,
    borderRadius: THEME.borderRadius.standard,
    backgroundColor: THEME.colors.calm.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorBar: {
    width: 4,
    borderRadius: 2,
    marginRight: THEME.spacing.sm,
    minHeight: 44,
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
    backgroundColor: THEME.colors.overlay,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalKeyboardWrap: {
    maxHeight: '92%',
  },
  modalSheet: {
    backgroundColor: THEME.colors.calm.card,
    borderTopLeftRadius: THEME.borderRadius.rounded * 2,
    borderTopRightRadius: THEME.borderRadius.rounded * 2,
    maxHeight: '92%',
    overflow: 'hidden',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME.colors.calm.border,
    marginTop: THEME.spacing.sm,
    marginBottom: THEME.spacing.xs,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: THEME.spacing.md,
    paddingBottom: THEME.spacing.md,
    gap: THEME.spacing.xs,
  },
  modalIconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalIconSpacer: {
    width: 40,
  },
  modalTitleWrap: {
    flex: 1,
    gap: 4,
    paddingTop: 4,
  },
  modalTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    textAlign: 'center',
  },
  modalSubtitle: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  modalListScroll: {
    maxHeight: 480,
  },
  modalListContent: {
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  createCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.calm.mist,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    minHeight: THEME.sizes.touchTarget,
  },
  createCardIcon: {
    width: 44,
    height: 44,
    borderRadius: THEME.borderRadius.standard,
    backgroundColor: THEME.colors.calm.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createCardText: {
    flex: 1,
    gap: 2,
  },
  createCardTitle: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  createCardSub: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  listSectionLabel: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.secondary,
    marginTop: THEME.spacing.xs,
    marginBottom: 2,
    paddingHorizontal: 2,
  },
  projectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    paddingVertical: THEME.spacing.sm,
    paddingRight: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.calm.card,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    minHeight: THEME.sizes.touchTarget,
    overflow: 'hidden',
  },
  projectCardSelected: {
    borderColor: THEME.colors.calm.lavenderDeep,
    backgroundColor: THEME.colors.calm.lavender,
  },
  projectCardBar: {
    width: 5,
    alignSelf: 'stretch',
    borderTopLeftRadius: THEME.borderRadius.rounded,
    borderBottomLeftRadius: THEME.borderRadius.rounded,
  },
  looseBar: {
    backgroundColor: THEME.colors.calm.mist,
  },
  projectCardBody: {
    flex: 1,
    gap: 2,
    paddingVertical: THEME.spacing.xs,
  },
  projectCardName: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
  },
  projectCardNameSelected: {
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
  projectCardMeta: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
  },
  projectCardCheck: {
    ...THEME.typography.body,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
    paddingRight: THEME.spacing.xs,
  },
  loadingWrap: {
    alignItems: 'center',
    gap: THEME.spacing.sm,
    paddingVertical: THEME.spacing.lg,
  },
  loadingText: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
  },
  emptyWrap: {
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.xs,
  },
  emptyText: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
    textAlign: 'center',
  },
  createStep: {
    flexShrink: 1,
  },
  createScroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  createScrollContent: {
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.xs,
    gap: THEME.spacing.sm,
  },
  createSubmitBtn: {
    marginTop: THEME.spacing.xs,
  },
  createFooterError: {
    ...THEME.typography.small,
    color: THEME.colors.semantic.danger,
    textAlign: 'center',
  },
});
