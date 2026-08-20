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
  /** Separador inferior estilo lista Musa/ajustes. */
  showDivider?: boolean;
  destructive?: boolean;
  disabled?: boolean;
};

export function YoMenuRow({
  icon,
  title,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  subtitle,
  style,
  showDivider = false,
  destructive = false,
  disabled = false,
}: YoMenuRowProps) {
  return (
    <View>
      <TouchableOpacity
        style={[styles.menuItem, style, disabled && styles.menuItemDisabled]}
        activeOpacity={0.7}
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
      >
        <View style={styles.iconSlot}>{icon}</View>
        <View style={styles.menuItemContent}>
          <Text style={[styles.menuItemText, destructive && styles.destructiveText]}>{title}</Text>
          {subtitle ? <Text style={styles.menuItemSubtext}>{subtitle}</Text> : null}
        </View>
        <ChevronRight
          size={20}
          color={destructive ? THEME.colors.text.tertiary : THEME.colors.text.tertiary}
        />
      </TouchableOpacity>
      {showDivider ? <View style={styles.divider} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.md,
    minHeight: THEME.sizes.touchTarget,
  },
  iconSlot: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemContent: {
    flex: 1,
    minWidth: 0,
  },
  menuItemSubtext: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
    marginTop: 2,
  },
  menuItemText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
  },
  destructiveText: {
    color: THEME.colors.text.secondary,
  },
  menuItemDisabled: {
    opacity: 0.55,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: THEME.colors.calm.border,
    marginLeft: THEME.spacing.md + 28 + THEME.spacing.sm,
    marginRight: THEME.spacing.md,
  },
});
