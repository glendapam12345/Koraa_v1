import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { ProjectCard, type Project } from './ProjectCard';
import { Plus, X } from 'lucide-react-native';
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

interface ProjectSelectorProps {
  selectedProjectId: string | null;
  onSelect: (projectId: string | null) => void;
  userId: string;
}

export function ProjectSelector({ selectedProjectId, onSelect, userId }: ProjectSelectorProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PROJECT_COLORS[0]);
  const [priority, setPriority] = useState(5);
  const [isCreating, setIsCreating] = useState(false);

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

  const handleSelect = (projectId: string | null) => {
    onSelect(projectId);
    setShowModal(false);
  };

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para el proyecto');
      return;
    }

    setIsCreating(true);
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
        // Recargar proyectos
        await loadProjects();
        // Seleccionar el nuevo proyecto automáticamente
        handleSelect(data.id);
        // Limpiar formulario
        setProjectName('');
        setSelectedColor(PROJECT_COLORS[0]);
        setPriority(5);
        setShowCreateModal(false);
        setIsCreating(false);
      }
    } catch (error) {
      logger.error('Error creating project:', error);
      Alert.alert('Error', 'Ocurrió un error al crear el proyecto');
    } finally {
      setIsCreating(false);
    }
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <>
      <TouchableOpacity
        onPress={() => setShowModal(true)}
        style={styles.selector}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={selectedProject ? `Proyecto: ${selectedProject.name}` : 'Seleccionar proyecto'}
      >
        {selectedProject ? (
          <View style={styles.selectedContainer}>
            <View style={[styles.colorDot, { backgroundColor: selectedProject.color }]} />
            <Text style={styles.selectedText}>{selectedProject.name}</Text>
          </View>
        ) : (
          <View style={styles.unselectedContainer}>
            <Plus size={16} color={THEME.colors.text.secondary} />
            <Text style={styles.unselectedText}>Agregar a proyecto</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Proyecto</Text>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
              >
                <X size={24} color={THEME.colors.text.main} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.projectsList}>
              <TouchableOpacity
                onPress={() => handleSelect(null)}
                style={[
                  styles.option,
                  selectedProjectId === null && styles.selectedOption,
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedProjectId === null && styles.selectedOptionText,
                  ]}
                >
                  Sin proyecto
                </Text>
              </TouchableOpacity>

              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onPress={() => handleSelect(project.id)}
                  selected={selectedProjectId === project.id}
                />
              ))}

              {/* Botón para crear nuevo proyecto */}
              <TouchableOpacity
                onPress={() => setShowCreateModal(true)}
                style={styles.createProjectButton}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Crear nuevo proyecto"
              >
                <LinearGradient
                  colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.createProjectButtonGradient}
                >
                  <Plus size={20} color="#FFFFFF" />
                  <Text style={styles.createProjectButtonText}>Crear nuevo proyecto</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal para crear proyecto */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!isCreating) {
            setShowCreateModal(false);
            setProjectName('');
            setSelectedColor(PROJECT_COLORS[0]);
            setPriority(5);
          }
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.createModalOverlay}
        >
          <View style={styles.createModalContent}>
            <View style={styles.createModalHeader}>
              <Text style={styles.createModalTitle}>Nuevo Proyecto</Text>
              <TouchableOpacity
                onPress={() => {
                  if (!isCreating) {
                    setShowCreateModal(false);
                    setProjectName('');
                    setSelectedColor(PROJECT_COLORS[0]);
                    setPriority(5);
                  }
                }}
                style={styles.closeButton}
                disabled={isCreating}
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
              >
                <X size={24} color={THEME.colors.text.main} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.createForm} showsVerticalScrollIndicator={false}>
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Nombre del proyecto</Text>
                <TextInput
                  style={styles.formInput}
                  value={projectName}
                  onChangeText={setProjectName}
                  placeholder="Ej: Mi App, Marca de Ropa, Contenido"
                  placeholderTextColor={THEME.colors.text.secondary}
                  autoFocus
                  editable={!isCreating}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Color</Text>
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
                      disabled={isCreating}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Prioridad (1-10)</Text>
                <TextInput
                  style={styles.formInput}
                  value={priority.toString()}
                  onChangeText={(text) => {
                    const value = parseInt(text, 10);
                    if (!isNaN(value) && value >= 1 && value <= 10) {
                      setPriority(value);
                    }
                  }}
                  keyboardType="numeric"
                  placeholder="5"
                  editable={!isCreating}
                />
                <Text style={styles.formHelpText}>
                  Mayor número = más prioridad
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleCreateProject}
                style={[styles.createButton, isCreating && styles.createButtonDisabled]}
                disabled={isCreating || !projectName.trim()}
                accessibilityRole="button"
                accessibilityLabel="Crear proyecto"
              >
                <LinearGradient
                  colors={
                    isCreating || !projectName.trim()
                      ? [THEME.colors.fill[200], THEME.colors.fill[200]]
                      : [THEME.colors.gradient.blue, THEME.colors.gradient.pink]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.createButtonGradient}
                >
                  <Text style={styles.createButtonText}>
                    {isCreating ? 'Creando...' : 'Crear Proyecto'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selector: {
    marginBottom: THEME.spacing.md,
  },
  selectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.fill[200],
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.standard,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: THEME.spacing.xs,
  },
  selectedText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  unselectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.fill[200],
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.standard,
    borderWidth: 1,
    borderColor: THEME.colors.text.secondary,
    borderStyle: 'dashed',
  },
  unselectedText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    marginLeft: THEME.spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: THEME.colors.fill[100],
    borderTopLeftRadius: THEME.borderRadius.rounded,
    borderTopRightRadius: THEME.borderRadius.rounded,
    maxHeight: '80%',
    paddingBottom: THEME.spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: THEME.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.fill[200],
  },
  modalTitle: {
    ...THEME.typography.h2,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  closeButton: {
    padding: THEME.spacing.xs,
  },
  projectsList: {
    padding: THEME.spacing.lg,
  },
  option: {
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.standard,
    backgroundColor: THEME.colors.fill[200],
    marginBottom: THEME.spacing.sm,
  },
  selectedOption: {
    backgroundColor: THEME.colors.gradient.blue,
  },
  optionText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
  },
  selectedOptionText: {
    color: '#FFFFFF',
    fontFamily: THEME.fonts.heading.bold,
  },
  emptyState: {
    padding: THEME.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
  },
  createProjectButton: {
    marginTop: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    overflow: 'hidden',
  },
  createProjectButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  createProjectButtonText: {
    ...THEME.typography.body,
    color: '#FFFFFF',
    fontFamily: THEME.fonts.heading.bold,
  },
  createModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  createModalContent: {
    backgroundColor: THEME.colors.fill[100],
    borderTopLeftRadius: THEME.borderRadius.rounded,
    borderTopRightRadius: THEME.borderRadius.rounded,
    maxHeight: '90%',
  },
  createModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: THEME.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.fill[200],
  },
  createModalTitle: {
    ...THEME.typography.h2,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  createForm: {
    padding: THEME.spacing.lg,
  },
  formSection: {
    marginBottom: THEME.spacing.lg,
  },
  formLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.xs,
    fontFamily: THEME.fonts.heading.medium,
  },
  formInput: {
    ...THEME.typography.body,
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.standard,
    padding: THEME.spacing.sm,
    color: THEME.colors.text.main,
  },
  formHelpText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    marginTop: THEME.spacing.xs,
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
  createButtonDisabled: {
    opacity: 0.6,
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
