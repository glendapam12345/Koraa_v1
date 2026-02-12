import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { THEME } from '@/constants/theme';
import { Edit, Trash2 } from 'lucide-react-native';

interface TaskMenuModalProps {
  visible: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function TaskMenuModal({ visible, onEdit, onDelete }: TaskMenuModalProps) {
  if (!visible) return null;

  return (
    <View style={styles.menuDropdown}>
      <TouchableOpacity
        style={styles.menuItem}
        onPress={onEdit}
        accessibilityRole="button"
        accessibilityLabel="Editar tarea"
      >
        <Edit size={18} color={THEME.colors.text.main} />
        <Text style={styles.menuItemText}>Editar</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.menuItem, styles.menuItemDanger]}
        onPress={onDelete}
        accessibilityRole="button"
        accessibilityLabel="Eliminar tarea"
      >
        <Trash2 size={18} color="#FF6B6B" />
        <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Eliminar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  menuDropdown: {
    position: 'absolute',
    right: 0,
    top: 50,
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.standard,
    padding: THEME.spacing.xs,
    minWidth: 150,
    ...THEME.shadows.soft,
    zIndex: 1000,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.standard,
  },
  menuItemDanger: {
    marginTop: THEME.spacing.xs,
  },
  menuItemText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontSize: 14,
  },
  menuItemTextDanger: {
    color: '#FF6B6B',
  },
});
