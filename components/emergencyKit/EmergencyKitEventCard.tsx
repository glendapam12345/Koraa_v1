import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';

type EmergencyKitEventCardProps = {
  emoji: string;
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function EmergencyKitEventCard({
  emoji,
  label,
  selected,
  onPress,
}: EmergencyKitEventCardProps) {
  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
    >
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '46%',
    maxWidth: '48%',
    backgroundColor: THEME.colors.calm.mist,
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.sm,
    alignItems: 'center',
    gap: THEME.spacing.xs,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    minHeight: 88,
    justifyContent: 'center',
  },
  cardSelected: {
    borderColor: THEME.colors.calm.lavenderDeep,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
  },
  emoji: {
    fontSize: 28,
  },
  label: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
  },
  labelSelected: {
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
  },
});
