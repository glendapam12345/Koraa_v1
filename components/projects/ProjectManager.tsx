import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { ProjectCard, type Project } from './ProjectCard';
import { Plus, X, Trash2 } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

const PROJECT_COLORS = [
  '#4A90E2', // Blue
  '#FF6B6B', // Red
  '#9B59B6', // Purple
  '#FFD700', // Gold
  '#FF1493', // Pink
  '#00CED1', // Turquoise
  '#32CD32', // Green
  '#FF8C00', // Orange
];

interface ProjectManagerProps {
  userId: string;
  onProjectSelect?: (project: Project | null) => void;
}

export function ProjectManager({ userId, onProjectSelect }: ProjectManagerProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectName, setProjectName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PROJECT_COLORS[0]);
  const [priority, setPriority] = useState(5);

  useEffect(() => {
    loadProjects();
  }, [userId]);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('priority', { ascending: false });

      if (error) {
        logger.error('Error loading projects:', error);
        return;
      }

      if (data) {
        setProjects(data);
      }
    } catch (error) {
      logger.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!projectName.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para el proyecto');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: userId,
          name: projectName.trim(),
          color: selectedColor,
          priority: priority,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating project:', error);
        Alert.alert('Error', 'No se pudo crear el proyecto');
        return;
      }

      if (data) {
        setProjects([...projects, data]);
        setProjectName('');
        setShowCreateModal(false);
        onProjectSelect?.(data);
      }
    } catch (error) {
      logger.error('Error creating project:', error);
      Alert.alert('Error', 'Ocurrió un error al crear el proyecto');
    }
  };

  const handleDelete = async (projectId: string) => {
    Alert.alert(
      'Eliminar proyecto',
      '¿Estás seguro? Las tareas de este proyecto quedarán sin proyecto asignado.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('projects')
                .delete()
                .eq('id', projectId);

              if (error) {
                logger.error('Error deleting project:', error);
                Alert.alert('Error', 'No se pudo eliminar el proyecto');
                return;
              }

              setProjects(projects.filter((p) => p.id !== projectId));
            } catch (error) {
              logger.error('Error deleting project:', error);
              Alert.alert('Error', 'Ocurrió un error al eliminar el proyecto');
            }
          },
        },
      ]
    );
  };

  const handleUpdatePriority = async (projectId: string, newPriority: number) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ priority: newPriority })
        .eq('id', projectId);

      if (error) {
        logger.error('Error updating project priority:', error);
        return;
      }

      setProjects(
        projects.map((p) => (p.id === projectId ? { ...p, priority: newPriority } : p))
      );
    } catch (error) {
      logger.error('Error updating project priority:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Proyectos</Text>
        <TouchableOpacity
          onPress={() => {
            setEditingProject(null);
            setProjectName('');
            setSelectedColor(PROJECT_COLORS[0]);
            setPriority(5);
            setShowCreateModal(true);
          }}
          style={styles.addButton}
          accessibilityRole="button"
          accessibilityLabel="Crear nuevo proyecto"
        >
          <LinearGradient
            colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.addButtonGradient}
          >
            <Plus size={20} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.projectsList}>
        {projects.map((project) => (
          <View key={project.id} style={styles.projectRow}>
            <ProjectCard
              project={project}
              onPress={() => onProjectSelect?.(project)}
              onLongPress={() => {
                Alert.alert(
                  project.name,
                  '¿Qué deseas hacer?',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Eliminar',
                      style: 'destructive',
                      onPress: () => handleDelete(project.id),
                    },
                  ]
                );
              }}
            />
          </View>
        ))}

        {projects.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No tienes proyectos aún.{'\n'}Crea uno para organizar tus tareas.
            </Text>
          </View>
        )}
      </ScrollView>

      {showCreateModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingProject ? 'Editar Proyecto' : 'Nuevo Proyecto'}
              </Text>
              <TouchableOpacity
                onPress={() => setShowCreateModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color={THEME.colors.text.main} />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>Nombre del proyecto</Text>
              <TextInput
                style={styles.input}
                value={projectName}
                onChangeText={setProjectName}
                placeholder="Ej: Mi App, Marca de Ropa, Contenido"
                placeholderTextColor={THEME.colors.text.secondary}
                autoFocus
              />

              <Text style={styles.label}>Color</Text>
              <View style={styles.colorPicker}>
                {PROJECT_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    onPress={() => setSelectedColor(color)}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      selectedColor === color && styles.selectedColor,
                    ]}
                  />
                ))}
              </View>

              <Text style={styles.label}>Prioridad (1-10)</Text>
              <TextInput
                style={styles.input}
                value={priority.toString()}
                onChangeText={(text) => {
                  const value = parseInt(text, 10);
                  if (!isNaN(value) && value >= 1 && value <= 10) {
                    setPriority(value);
                  }
                }}
                keyboardType="numeric"
                placeholder="5"
              />

              <TouchableOpacity
                onPress={handleCreate}
                style={styles.createButton}
                accessibilityRole="button"
              >
                <LinearGradient
                  colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.createButtonGradient}
                >
                  <Text style={styles.createButtonText}>
                    {editingProject ? 'Guardar' : 'Crear Proyecto'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: THEME.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.fill[200],
  },
  title: {
    ...THEME.typography.h2,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  addButton: {
    borderRadius: THEME.borderRadius.pill,
    overflow: 'hidden',
  },
  addButtonGradient: {
    padding: THEME.spacing.sm,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectsList: {
    flex: 1,
    padding: THEME.spacing.lg,
  },
  projectRow: {
    marginBottom: THEME.spacing.sm,
  },
  emptyState: {
    padding: THEME.spacing.xl * 2,
    alignItems: 'center',
  },
  emptyText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    width: '90%',
    maxWidth: 400,
    padding: THEME.spacing.lg,
    ...THEME.shadows.soft,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.lg,
  },
  modalTitle: {
    ...THEME.typography.h2,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  closeButton: {
    padding: THEME.spacing.xs,
  },
  form: {
    gap: THEME.spacing.md,
  },
  label: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.xs,
  },
  input: {
    ...THEME.typography.body,
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.standard,
    padding: THEME.spacing.sm,
    color: THEME.colors.text.main,
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.sm,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: THEME.colors.gradient.blue,
    borderWidth: 3,
  },
  createButton: {
    borderRadius: THEME.borderRadius.standard,
    overflow: 'hidden',
    marginTop: THEME.spacing.md,
  },
  createButtonGradient: {
    padding: THEME.spacing.md,
    alignItems: 'center',
  },
  createButtonText: {
    ...THEME.typography.body,
    color: '#FFFFFF',
    fontFamily: THEME.fonts.heading.bold,
  },
});
