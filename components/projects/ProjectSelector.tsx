import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, TextInput, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { THEME } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { FolderKanban, X, Plus } from 'lucide-react-native';

const PROJECT_COLORS = [
  THEME.colors.gradient.blue,
  THEME.colors.gradient.pink,
  THEME.colors.gradient.blue,
  THEME.colors.gradient.pink,
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
  /** Llamado al abrir el modal (p. ej. para cerrar teclado del formulario principal) */
  onBeforeOpenModal?: () => void;
  /** Si false, no se muestra la etiqueta "Proyecto (opcional)" (útil cuando el padre ya la muestra) */
  showLabel?: boolean;
}

export function ProjectSelector({ selectedProjectId, onSelect, userId, onBeforeOpenModal, showLabel = true }: ProjectSelectorProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PROJECT_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const newProjectInputRef = useRef<TextInput>(null);

  const loadProjects = async () => {
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
  };

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
  }, [userId]);

  const handleCreateProject = async () => {
    const name = newName.trim();
    if (!name) return;
    setSaving(true);
    const { data, error } = await supabase
      .from('projects')
      .insert({ user_id: userId, name, color: newColor })
      .select('id, name, color')
      .single();
    setSaving(false);
    if (error) return;
    setProjects((prev) => [data as Project, ...prev]);
    onSelect(data.id);
    setNewName('');
    setNewColor(PROJECT_COLORS[0]);
    setShowNewProject(false);
    setShowModal(false);
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <View style={styles.container}>
      {showLabel && <Text style={styles.label}>Proyecto (opcional)</Text>}
      <TouchableOpacity
        style={[styles.selector, selectedProject && styles.selectorWithProject]}
        onPress={() => {
          Keyboard.dismiss();
          onBeforeOpenModal?.();
          setShowModal(true);
        }}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={selectedProject ? `Proyecto: ${selectedProject.name}` : 'Tareas sueltas'}
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
              <Text style={styles.selectedProjectLabel}>Proyecto</Text>
              <Text style={styles.selectorText}>{selectedProject.name}</Text>
              <Text style={styles.selectedColorHint}>Color: aplicado en Inicio</Text>
            </View>
          </View>
        ) : (
          <View style={styles.selectedRow}>
            <FolderKanban size={20} color={THEME.colors.text.secondary} />
            <Text style={[styles.selectorText, styles.placeholderText]}>Tareas sueltas (sin proyecto)</Text>
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
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => { Keyboard.dismiss(); setShowModal(false); }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalKeyboardWrap}
          >
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>¿Proyecto o tareas sueltas?</Text>
                <TouchableOpacity
                  onPress={() => { Keyboard.dismiss(); setShowModal(false); }}
                  style={styles.modalClose}
                  accessibilityLabel="Cerrar"
                >
                  <X size={24} color={THEME.colors.text.main} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Text style={styles.modalSectionHint}>Elige una opción. Si no eliges proyecto, la tarea queda suelta.</Text>
                <TouchableOpacity
                  style={[styles.optionRow, styles.optionRowFirst]}
                  onPress={() => {
                    onSelect(null);
                    setShowModal(false);
                  }}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Tareas sueltas, sin proyecto"
                >
                  <FolderKanban size={22} color={THEME.colors.text.secondary} />
                  <View style={styles.optionTextWrap}>
                    <Text style={styles.optionText}>Tareas sueltas</Text>
                    <Text style={styles.optionSubtext}>Sin proyecto</Text>
                  </View>
                  {!selectedProjectId && <Text style={styles.optionCheck}>✓</Text>}
                </TouchableOpacity>

                {loading ? (
                  <Text style={styles.loadingText}>Cargando proyectos…</Text>
                ) : (
                  <>
                    {projects.length > 0 && (
                      <Text style={styles.modalSectionTitle}>Mis proyectos</Text>
                    )}
                    {projects.map((p) => (
                      <TouchableOpacity
                        key={p.id}
                        style={styles.optionRow}
                        onPress={() => {
                          onSelect(p.id);
                          setShowModal(false);
                        }}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={`Proyecto ${p.name}`}
                      >
                        <View
                          style={[
                            styles.colorDot,
                            { backgroundColor: p.color || THEME.colors.gradient.blue },
                          ]}
                        />
                        <Text style={styles.optionText}>{p.name}</Text>
                        {selectedProjectId === p.id && <Text style={styles.optionCheck}>✓</Text>}
                      </TouchableOpacity>
                    ))}
                    {showNewProject ? (
                      <View style={styles.newProjectForm}>
                        <Text style={styles.newProjectFormTitle}>Crear proyecto nuevo</Text>
                        <Text style={styles.newProjectLabel}>Nombre del proyecto</Text>
                        <TextInput
                          ref={newProjectInputRef}
                          style={styles.newProjectInput}
                          value={newName}
                          onChangeText={setNewName}
                          placeholder="Ej. Maratón, Mi app, Salud"
                          placeholderTextColor={THEME.colors.text.secondary}
                          onSubmitEditing={handleCreateProject}
                          returnKeyType="done"
                        />
                        <Text style={styles.newProjectLabel}>Color</Text>
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
                            />
                          ))}
                        </View>
                        <View style={styles.newProjectButtons}>
                          <TouchableOpacity
                            style={styles.newProjectCancel}
                            onPress={() => {
                              setShowNewProject(false);
                              setNewName('');
                              Keyboard.dismiss();
                            }}
                          >
                            <Text style={styles.newProjectCancelText}>Cancelar</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.newProjectSave, saving && styles.newProjectSaveDisabled]}
                            onPress={handleCreateProject}
                            disabled={saving || !newName.trim()}
                          >
                            <Text style={styles.newProjectSaveText}>
                              {saving ? 'Guardando…' : 'Crear proyecto'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.addProjectRow}
                        onPress={() => {
                          setShowNewProject(true);
                          setTimeout(() => newProjectInputRef.current?.focus(), 300);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel="Crear nuevo proyecto"
                      >
                        <Plus size={20} color={THEME.colors.gradient.blue} />
                        <Text style={styles.addProjectText}>Crear nuevo proyecto</Text>
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
    ...THEME.typography.small,
    fontSize: 11,
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
    maxHeight: '85%',
  },
  modalContent: {
    backgroundColor: THEME.colors.fill[100],
    borderTopLeftRadius: THEME.borderRadius.rounded * 2,
    borderTopRightRadius: THEME.borderRadius.rounded * 2,
    maxHeight: '85%',
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
  modalList: {
    padding: THEME.spacing.md,
    maxHeight: 320,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.standard,
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
  optionSubtext: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    marginTop: 2,
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
