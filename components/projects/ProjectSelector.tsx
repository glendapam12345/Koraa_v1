import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import { THEME } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { FolderKanban, X, Plus } from 'lucide-react-native';

const PROJECT_COLORS = [
  THEME.colors.gradient.blue,
  THEME.colors.gradient.pink,
  '#4A90E2',
  '#FF6B6B',
  '#32CD32',
  '#9B59B6',
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
}

export function ProjectSelector({ selectedProjectId, onSelect, userId }: ProjectSelectorProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PROJECT_COLORS[0]);
  const [saving, setSaving] = useState(false);

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
      <Text style={styles.label}>Proyecto (opcional)</Text>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setShowModal(true)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Elegir proyecto"
      >
        {selectedProject ? (
          <View style={styles.selectedRow}>
            <View
              style={[
                styles.colorDot,
                { backgroundColor: selectedProject.color || THEME.colors.gradient.blue },
              ]}
            />
            <Text style={styles.selectorText}>{selectedProject.name}</Text>
          </View>
        ) : (
          <View style={styles.selectedRow}>
            <FolderKanban size={20} color={THEME.colors.text.secondary} />
            <Text style={[styles.selectorText, styles.placeholderText]}>Tareas sueltas</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowModal(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>¿En qué lista?</Text>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={styles.modalClose}
                accessibilityLabel="Cerrar"
              >
                <X size={24} color={THEME.colors.text.main} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={styles.optionRow}
                onPress={() => {
                  onSelect(null);
                  setShowModal(false);
                }}
                activeOpacity={0.7}
              >
                <FolderKanban size={20} color={THEME.colors.text.secondary} />
                <Text style={styles.optionText}>Tareas sueltas</Text>
                {!selectedProjectId && (
                  <Text style={styles.optionCheck}>✓</Text>
                )}
              </TouchableOpacity>
              {loading ? (
                <Text style={styles.loadingText}>Cargando…</Text>
              ) : (
                <>
                  {projects.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={styles.optionRow}
                      onPress={() => {
                        onSelect(p.id);
                        setShowModal(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.colorDot,
                          { backgroundColor: p.color || THEME.colors.gradient.blue },
                        ]}
                      />
                      <Text style={styles.optionText}>{p.name}</Text>
                      {selectedProjectId === p.id && (
                        <Text style={styles.optionCheck}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                  {showNewProject ? (
                    <View style={styles.newProjectForm}>
                      <Text style={styles.newProjectLabel}>Nombre del proyecto</Text>
                      <TextInput
                        style={styles.newProjectInput}
                        value={newName}
                        onChangeText={setNewName}
                        placeholder="Ej. Mi app"
                        placeholderTextColor={THEME.colors.text.secondary}
                        autoFocus
                      />
                      <Text style={styles.newProjectLabel}>Color</Text>
                      <View style={styles.colorRow}>
                        {PROJECT_COLORS.map((c) => (
                          <TouchableOpacity
                            key={c}
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
                            {saving ? 'Guardando…' : 'Crear'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.addProjectRow}
                      onPress={() => setShowNewProject(true)}
                    >
                      <Plus size={20} color={THEME.colors.gradient.blue} />
                      <Text style={styles.addProjectText}>Nuevo proyecto</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </ScrollView>
          </View>
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
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: THEME.colors.fill[100],
    borderTopLeftRadius: THEME.borderRadius.rounded * 2,
    borderTopRightRadius: THEME.borderRadius.rounded * 2,
    maxHeight: '70%',
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
  optionText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    flex: 1,
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
    color: '#FFFFFF',
    fontFamily: THEME.fonts.heading.bold,
  },
});
