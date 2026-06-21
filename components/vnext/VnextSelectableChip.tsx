import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { THEME } from '@/constants/theme';

type VnextSelectableChipProps = {
  label: string;
  emoji?: string;
  selected?: boolean;
  onPress: () => void;
  accentColor?: string;
};

export function VnextSelectableChip({
  label,
  emoji,
  selected = false,
  onPress,
  accentColor = THEME.colors.calm.lavenderDeep,
}: VnextSelectableChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[
        styles.chip,
        selected && { borderColor: accentColor, backgroundColor: THEME.colors.calm.lavender },
      ]}
    >
      {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
      <Text style={[styles.label, selected && { color: accentColor }]} numberOfLines={2}>
        {label}
      </Text>
      {selected ? <Check size={16} color={accentColor} /> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.calm.card,
    borderWidth: 1.5,
    borderColor: THEME.colors.calm.border,
  },
  emoji: {
    fontSize: THEME.typography.displayEmojiSm.fontSize,
    lineHeight: 24,
  },
  label: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
    flexShrink: 1,
    lineHeight: 20,
  },
});
