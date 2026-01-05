import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { THEME } from '@/constants/theme';

type EmotionCardProps = {
  emoji: string;
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function EmotionCard({ emoji, label, selected, onPress }: EmotionCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.container,
        selected && styles.selected,
      ]}
      activeOpacity={0.7}
    >
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

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
