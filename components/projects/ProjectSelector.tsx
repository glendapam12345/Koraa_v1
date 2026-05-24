import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, TextInput, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useEffect, useRef, useCallback } from 'react';
import { THEME } from '@/constants/theme';
import { supabase, getSchemaSetupMessage } from '@/lib/supabase';
import { FolderKanban, X, Plus } from 'lucide-react-native';
import { useI18n } from '@/contexts/I18nContext';

const PROJECT_COLORS = [
  THEME.colors.gradient.blue,
  THEME.colors.gradient.pink,
  '#8B5CF6',
  '#14B8A6',
  '#32CD32',
  THEME.colors.category.personal,
  '#FFA500',
  '#00CED1',
];

interface Project {
  id: string;
  name: string;
  color: string;
}

interface ProjectSelectorProps {
  selectedProjectId: string | null;
  onSelect: (projectId: string | null) => void;
  userId: string;
  onBeforeOpenModal?: () => void;
  showLabel?: boolean;
  onError?: (message: string) => void;
  onSuccess?: (projectName: string) => void;
  /** Cuando true, el usuario ya eligió "Sí" a proyecto: mostrar "Elige un proyecto" y poner "Ninguno" al final del modal */
  assignMode?: boolean;
}

export function ProjectSelector({ selectedProjectId, onSelect, userId, onBeforeOpenModal, showLabel = true, onError, onSuccess, assignMode = false }: ProjectSelectorProps) {
  const { t } = useI18n();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PROJECT_COLORS[0]);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const newProjectInputRef = useRef<TextInput>(null);
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
      .select('id, name, color')
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
    load();
  }, [userId, loadProjects]);

  const handleCreateProject = async () => {
    const name = newName.trim();
    if (!name) {
      setFormError(t('components.projectNameRequired'));
      return;
    }
    if (name.length < 2) {
      setFormError(t('components.projectNameMin'));
      return;
    }
    const alreadyExists = projects.some((p) => p.name.trim().toLowerCase() === name.toLowerCase());
    if (alreadyExists) {
      setFormError(t('components.projectDuplicate'));
      return;
    }

    setFormError(null);
    setSaving(true);
    const { data, error } = await supabase
      .from('projects')
      .insert({ user_id: userId, name, color: newColor })
      .select('id, name, color')
      .single();
    setSaving(false);
    if (error) {
      const schemaType = getSchemaSetupMessage(error);
      const message = schemaType === 'projects_table'
        ? t('components.projectCreateSchemaError')
        : t('components.projectCreateError');
      setFormError(message);
      onError?.(message);
      return;
    }
    setProjects((prev) => [data as Project, ...prev]);
    onSelect(data.id);
    setNewName('');
    setNewColor(PROJECT_COLORS[0]);
    setFormError(null);
    setShowNewProject(false);
    setShowModal(false);
    onSuccess?.(data.name);
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <View style={styles.container}>
      {showLabel && <Text style={styles.label}>{t('projectSelectorExtra.optionalLabel')}</Text>}
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
            : assignMode
              ? t('projectSelectorExtra.a11yChoose')
              : t('projectSelectorExtra.a11yLoose')
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
              <Text style={styles.selectedColorHint}>{t('projectSelectorExtra.colorHint')}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.selectedRow}>
            <FolderKanban size={20} color={THEME.colors.gradient.blue} />
            <Text style={[styles.selectorText, styles.placeholderText]}>
              {assignMode ? t('components.chooseProject') : t('components.projectLooseHint')}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => { Keyboard.dismiss(); setShowModal(false); }}
        onShow={() => {
          Keyboard.dismiss();
          setShowNewProject(false);
          setNewName('');
          setFormError(null);
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => { Keyboard.dismiss(); setShowModal(false); }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
            style={styles.modalKeyboardWrap}
          >
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{assignMode ? t('components.chooseProject') : t('components.projectModalAssign')}</Text>
                <TouchableOpacity
                  onPress={() => { Keyboard.dismiss(); setShowModal(false); }}
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
                {!assignMode && (
                  <Text style={styles.modalSectionHint}>{t('projectSelectorExtra.modalHint')}</Text>
                )}
                {!assignMode && (
                  <TouchableOpacity
                    style={[
                      styles.optionRow,
                      styles.optionRowFirst,
                      selectedProjectId == null && styles.optionRowSelected,
                    ]}
                    onPress={() => {
                      onSelect(null);
                      setShowModal(false);
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
                    {selectedProjectId == null && <Text style={styles.optionCheck}>✓</Text>}
                  </TouchableOpacity>
                )}

                {loading ? (
                  <Text style={styles.loadingText}>{t('components.loadingProjects')}</Text>
                ) : (
                  <>
                    {projects.length > 0 && (
                      <Text style={styles.modalSectionTitle}>{t('projectSelectorExtra.myProjects')}</Text>
                    )}
                    {projects.map((p) => {
                      const selected = selectedProjectId === p.id;
                      return (
                        <TouchableOpacity
                          key={p.id}
                          style={[styles.optionRow, selected && styles.optionRowSelected]}
                          onPress={() => {
                            onSelect(p.id);
                            setShowModal(false);
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
                          <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                            {p.name}
                          </Text>
                          {selected ? <Text style={styles.optionCheck}>✓</Text> : null}
                        </TouchableOpacity>
                      );
                    })}
                    {assignMode && (
                      <TouchableOpacity
                        style={[
                          styles.optionRow,
                          styles.optionRowNone,
                          selectedProjectId == null && styles.optionRowSelected,
                        ]}
                        onPress={() => {
                          onSelect(null);
                          setShowModal(false);
                        }}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={t('projectSelectorExtra.a11yNone')}
                        accessibilityState={{ selected: selectedProjectId == null }}
                      >
                        <FolderKanban
                          size={22}
                          color={
                            selectedProjectId == null
                              ? THEME.colors.gradient.blue
                              : THEME.colors.text.tertiary
                          }
                        />
                        <View style={styles.optionTextWrap}>
                          <Text
                            style={[
                              styles.optionText,
                              selectedProjectId == null && styles.optionTextSelected,
                            ]}
                          >
                            {t('projectSelectorExtra.noneAssign')}
                          </Text>
                        </View>
                        {selectedProjectId == null ? <Text style={styles.optionCheck}>✓</Text> : null}
                      </TouchableOpacity>
                    )}
                    {showNewProject ? (
                      <View style={styles.newProjectForm}>
                        <Text style={styles.newProjectFormTitle}>{t('projectSelectorExtra.newTitle')}</Text>
                        <Text style={styles.newProjectLabel}>{t('projectSelectorExtra.nameLabel')}</Text>
                        <TextInput
                          ref={newProjectInputRef}
                          style={styles.newProjectInput}
                          value={newName}
                          onChangeText={(value) => {
                            setNewName(value);
                            if (formError) setFormError(null);
                          }}
                          placeholder={t('projectSelectorExtra.namePlaceholder')}
                          placeholderTextColor={THEME.colors.text.secondary}
                          onSubmitEditing={handleCreateProject}
                          returnKeyType="done"
                        />
                        <Text style={styles.newProjectLabel}>{t('projectSelectorExtra.colorLabel')}</Text>
                        <Text style={styles.newProjectColorHint}>
                          {t('projectSelectorExtra.colorSelected', { color: newColor })}
                        </Text>
                        <View style={styles.colorRow}>
                          {PROJECT_COLORS.map((c, i) => (
                            <TouchableOpacity
                              key={`project-color-${i}`}
                              style={[
                                styles.colorOption,
                                { backgroundColor: c },
                                newColor === c && styles.colorOptionSelected,
                              ]}
                              onPress={() => setNewColor(c)}
                              accessibilityRole="button"
                              accessibilityLabel={t('projectSelectorExtra.a11yColor', {
                                color: String(i + 1),
                                selected: newColor === c ? t('commonExtra.selectedSuffix') : '',
                              })}
                            />
                          ))}
                        </View>
                        {formError ? <Text style={styles.newProjectError}>{formError}</Text> : null}
                        <View style={styles.newProjectButtons}>
                          <TouchableOpacity
                            style={styles.newProjectCancel}
                            onPress={() => {
                              setShowNewProject(false);
                              setNewName('');
                              Keyboard.dismiss();
                            }}
                          >
                            <Text style={styles.newProjectCancelText}>{t('common.cancel')}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.newProjectSave, saving && styles.newProjectSaveDisabled]}
                            onPress={handleCreateProject}
                            disabled={saving || !newName.trim()}
                          >
                            <Text style={styles.newProjectSaveText}>
                              {saving ? t('components.creatingProject') : t('components.createProject')}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.addProjectRow}
                        onPress={() => {
                          setShowNewProject(true);
                          setFormError(null);
                          setTimeout(() => newProjectInputRef.current?.focus(), 220);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={t('projectSelectorExtra.createNew')}
                      >
                        <Plus size={20} color={THEME.colors.gradient.blue} />
                        <Text style={styles.addProjectText}>{t('projectSelectorExtra.createNew')}</Text>
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
    marginBottom: THEME.spacing.md,
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
  },
  selectedProjectLabel: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    marginBottom: 2,
  },
  selectedColorHint: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
    marginTop: 2,
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
  placeholderText: {
    color: THEME.colors.text.secondary,
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
  optionRowNone: {
    marginTop: THEME.spacing.sm,
    paddingVertical: THEME.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.stroke[100],
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
    alignItems: 'center',
    gap: THEME.spacing.sm,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.sm,
    marginTop: THEME.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.stroke[100],
  },
  addProjectText: {
    ...THEME.typography.body,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.medium,
  },
  newProjectForm: {
    marginTop: THEME.spacing.md,
    padding: THEME.spacing.md,
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.standard,
  },
  newProjectFormTitle: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.sm,
  },
  newProjectLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.xs,
  },
  newProjectInput: {
    ...THEME.typography.body,
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.standard,
    padding: THEME.spacing.sm,
    marginBottom: THEME.spacing.sm,
    color: THEME.colors.text.main,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.md,
  },
  newProjectColorHint: {
    ...THEME.typography.small,
    fontSize: 12,
    color: THEME.colors.text.tertiary,
    marginBottom: THEME.spacing.xs,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: THEME.colors.text.main,
  },
  newProjectError: {
    ...THEME.typography.small,
    color: THEME.colors.semantic.danger,
    marginBottom: THEME.spacing.sm,
  },
  newProjectButtons: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
    justifyContent: 'flex-end',
  },
  newProjectCancel: {
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
  },
  newProjectCancelText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
  },
  newProjectSave: {
    backgroundColor: THEME.colors.gradient.blue,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.standard,
  },
  newProjectSaveDisabled: {
    opacity: 0.6,
  },
  newProjectSaveText: {
    ...THEME.typography.body,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
  },
});
