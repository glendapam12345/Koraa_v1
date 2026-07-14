import type { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronDown, ChevronRight } from 'lucide-react-native';
import { THEME } from '@/constants/theme';

type HoyPlanExpandableRowProps = {
  icon?: ReactNode;
  title: string;
  subtitle: string;
  expanded: boolean;
  onToggle: () => void;
  accessibilityLabel: string;
  variant?: 'accent' | 'muted';
  compact?: boolean;
  children?: ReactNode;
};

export function HoyPlanExpandableRow({
  icon,
  title,
  subtitle,
  expanded,
  onToggle,
  accessibilityLabel,
  variant = 'muted',
  compact = false,
  children,
}: HoyPlanExpandableRowProps) {
  const isAccent = variant === 'accent';

  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        style={[
          styles.row,
          compact && styles.rowCompact,
          isAccent && styles.rowAccent,
          expanded && (isAccent ? styles.rowAccentExpanded : styles.rowExpanded),
        ]}
        onPress={onToggle}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ expanded }}
      >
        {icon ? (
          <View
            style={[
              styles.iconWrap,
              compact && styles.iconWrapCompact,
              isAccent ? styles.iconWrapAccent : styles.iconWrapMuted,
            ]}
          >
            {icon}
          </View>
        ) : null}
        <View style={styles.rowText}>
          <Text style={[styles.rowTitle, compact && styles.rowTitleCompact]}>{title}</Text>
          <Text style={[styles.rowSub, compact && styles.rowSubCompact]} numberOfLines={2}>
            {subtitle}
          </Text>
        </View>
        {expanded ? (
          <ChevronDown size={18} color={THEME.colors.calm.lavenderDeep} />
        ) : (
          <ChevronRight size={18} color={THEME.colors.calm.lavenderDeep} />
        )}
      </TouchableOpacity>

      {expanded && children ? <View style={styles.expandInline}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    paddingVertical: THEME.spacing.sm + 2,
    paddingHorizontal: THEME.spacing.md,
    backgroundColor: THEME.colors.calm.card,
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    minHeight: THEME.sizes.touchTarget,
  },
  rowCompact: {
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.sm,
    minHeight: THEME.sizes.touchTarget + 8,
    gap: THEME.spacing.sm,
  },
  rowAccent: {
    borderColor: THEME.colors.calm.border,
    backgroundColor: THEME.colors.fill[100],
  },
  rowExpanded: {
    borderColor: THEME.colors.calm.border,
  },
  rowAccentExpanded: {
    borderColor: THEME.colors.calm.border,
    backgroundColor: THEME.colors.fill[100],
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapCompact: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  iconWrapAccent: {
    backgroundColor: THEME.colors.calm.mist,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  iconWrapMuted: {
    backgroundColor: THEME.colors.calm.mist,
  },
  rowText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  rowTitle: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    lineHeight: 22,
  },
  rowTitleCompact: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    lineHeight: 18,
  },
  rowSub: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 17,
  },
  rowSubCompact: {
    ...THEME.typography.small,
    lineHeight: 15,
  },
  expandInline: {
    gap: THEME.spacing.xs,
    paddingTop: 4,
  },
});
