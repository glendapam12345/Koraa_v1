import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react-native';
import { THEME } from '@/constants/theme';

type YoPrimaryActionRowProps = {
  icon: ReactNode;
  title: string;
  onPress: () => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
};

/** CTA primario al estilo fila destacada — una acción, sin ruido. */
export function YoPrimaryActionRow({
  icon,
  title,
  onPress,
  accessibilityLabel,
  accessibilityHint,
}: YoPrimaryActionRowProps) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      <View style={styles.iconWrap}>{icon}</View>
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
      <ChevronRight size={20} color={THEME.colors.calm.lavenderDeep} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    minHeight: 64,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.calm.lavender,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: THEME.borderRadius.standard,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.calm.card,
  },
  title: {
    ...THEME.typography.body,
    flex: 1,
    minWidth: 0,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
  },
});
