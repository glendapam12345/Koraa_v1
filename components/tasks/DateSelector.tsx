import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';

interface DateSelectorProps {
  selectedDate: string | null;
  onSelect: (date: string | null) => void;
}

export function DateSelector({ selectedDate, onSelect }: DateSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Fecha límite (opcional)</Text>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => onSelect(null)}
        activeOpacity={0.7}
      >
        <Text style={styles.selectorText}>
          {selectedDate || 'Sin fecha límite'}
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
