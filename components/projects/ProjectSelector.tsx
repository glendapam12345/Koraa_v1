import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { ProjectCard, type Project } from './ProjectCard';
import { Plus, X } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

interface ProjectSelectorProps {
  selectedProjectId: string | null;
  onSelect: (projectId: string | null) => void;
  userId: string;
}

export function ProjectSelector({ selectedProjectId, onSelect, userId }: ProjectSelectorProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

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

              {projects.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>
                    No tienes proyectos aún. Crea uno desde tu perfil.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
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
});
