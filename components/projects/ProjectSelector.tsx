import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';

interface ProjectSelectorProps {
  selectedProjectId: string | null;
  onSelect: (projectId: string | null) => void;
  userId: string;
}

export function ProjectSelector({ selectedProjectId, onSelect, userId }: ProjectSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Proyecto (opcional)</Text>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => onSelect(null)}
        activeOpacity={0.7}
      >
        <Text style={styles.selectorText}>
          {selectedProjectId || 'Sin proyecto'}
        </Text>
      </TouchableOpacity>
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
  selectorText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
  },
});
