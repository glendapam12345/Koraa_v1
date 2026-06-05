import { View, Text, TouchableOpacity, StyleSheet, type ViewStyle } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import type { ReactNode } from 'react';

type YoMenuRowProps = {
  icon: ReactNode;
  title: string;
  onPress: () => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
  subtitle?: string;
  style?: ViewStyle;
};

export function YoMenuRow({
  icon,
  title,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  subtitle,
  style,
}: YoMenuRowProps) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, style]}
      activeOpacity={0.7}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      {icon}
      <View style={styles.menuItemContent}>
        <Text style={styles.menuItemText}>{title}</Text>
        {subtitle ? <Text style={styles.menuItemSubtext}>{subtitle}</Text> : null}
      </View>
      <ChevronRight size={20} color={THEME.colors.text.tertiary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.md,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemSubtext: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
    marginTop: 2,
  },
  menuItemText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
  },
});
