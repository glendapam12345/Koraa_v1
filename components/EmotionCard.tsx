import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { memo } from 'react';
import { THEME } from '@/constants/theme';

type EmotionCardProps = {
  emoji: string;
  label: string;
  selected: boolean;
  onPress: () => void;
};

export const EmotionCard = memo(function EmotionCard({ emoji, label, selected, onPress }: EmotionCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.container,
        selected && styles.selected,
      ]}
      activeOpacity={0.7}
      accessibilityRole="radio"
      accessibilityLabel={`Emoción: ${label}`}
      accessibilityHint={selected ? "Emoción seleccionada. Toca para deseleccionar" : "Toca para seleccionar esta emoción"}
      accessibilityState={{ selected }}
    >
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.emoji === nextProps.emoji &&
    prevProps.label === nextProps.label &&
    prevProps.selected === nextProps.selected
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    flex: 1,
    margin: 4,
    ...THEME.shadows.soft,
  },
  selected: {
    borderWidth: 2,
    borderColor: THEME.colors.gradient.blue,
  },
  emoji: {
    fontSize: 48,
    marginBottom: THEME.spacing.xs,
  },
  label: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    textAlign: 'center',
  },
});
