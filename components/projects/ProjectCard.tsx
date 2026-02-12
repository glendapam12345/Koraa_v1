import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { Folder, MoreVertical } from 'lucide-react-native';
import { memo } from 'react';

export interface Project {
  id: string;
  name: string;
  color: string;
  icon?: string;
  priority: number;
}

interface ProjectCardProps {
  project: Project;
  taskCount?: number;
  onPress?: () => void;
  onLongPress?: () => void;
  selected?: boolean;
}

export const ProjectCard = memo(function ProjectCard({
  project,
  taskCount = 0,
  onPress,
  onLongPress,
  selected = false,
}: ProjectCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      style={[styles.container, selected && styles.selected]}
      accessibilityRole="button"
      accessibilityLabel={`Proyecto ${project.name} con ${taskCount} tareas`}
    >
      <LinearGradient
        colors={[project.color, `${project.color}CC`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Folder size={24} color="#FFFFFF" fill="#FFFFFF" opacity={0.9} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.name} numberOfLines={1}>
              {project.name}
            </Text>
            {taskCount > 0 && (
              <Text style={styles.count}>
                {taskCount} {taskCount === 1 ? 'tarea' : 'tareas'}
              </Text>
            )}
          </View>
          <View style={styles.priorityBadge}>
            <Text style={styles.priorityText}>{project.priority}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    overflow: 'hidden',
    ...THEME.shadows.soft,
  },
  selected: {
    borderWidth: 2,
    borderColor: THEME.colors.gradient.blue,
  },
  gradient: {
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: THEME.spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    ...THEME.typography.h3,
    color: '#FFFFFF',
    fontFamily: THEME.fonts.heading.bold,
    marginBottom: 2,
  },
  count: {
    ...THEME.typography.caption,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  priorityBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 32,
    alignItems: 'center',
  },
  priorityText: {
    ...THEME.typography.caption,
    color: '#FFFFFF',
    fontFamily: THEME.fonts.heading.bold,
    fontSize: 12,
  },
});
