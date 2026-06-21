import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Lock } from 'lucide-react-native';
import { THEME } from '@/constants/theme';

export type CalmSegment<T extends string> = {
  id: T;
  label: string;
  accessibilityLabel: string;
  locked?: boolean;
};

export type CalmSegmentedControlVariant = 'track' | 'accent' | 'chip';

type CalmSegmentedControlProps<T extends string> = {
  segments: CalmSegment<T>[];
  value: T;
  onChange: (id: T) => void;
  variant?: CalmSegmentedControlVariant;
  /** Para barras con muchas opciones (p. ej. periodos en Para mí). */
  scrollable?: boolean;
};

export function CalmSegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  variant = 'track',
  scrollable = false,
}: CalmSegmentedControlProps<T>) {
  const pills = segments.map((segment) => {
    const selected = value === segment.id;
    return (
      <SegmentPill
        key={segment.id}
        segment={segment}
        selected={selected}
        variant={variant}
        onPress={() => onChange(segment.id)}
      />
    );
  });

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        accessibilityRole="tablist"
      >
        {pills}
      </ScrollView>
    );
  }

  return (
    <View
      style={[
        styles.row,
        variant === 'track' && styles.rowTrack,
        variant === 'accent' && styles.rowAccent,
        variant === 'chip' && styles.chipRow,
      ]}
      accessibilityRole="tablist"
    >
      {pills}
    </View>
  );
}

function SegmentPill<T extends string>({
  segment,
  selected,
  variant,
  onPress,
}: {
  segment: CalmSegment<T>;
  selected: boolean;
  variant: CalmSegmentedControlVariant;
  onPress: () => void;
}) {
  const pillStyles = [
    styles.pill,
    variant === 'track' && styles.pillTrack,
    variant === 'accent' && styles.pillAccent,
    variant === 'chip' && styles.pillChip,
    selected && variant === 'track' && styles.pillTrackSelected,
    selected && variant === 'accent' && styles.pillAccentSelected,
    selected && variant === 'chip' && styles.pillChipSelected,
  ];

  const labelStyles = [
    styles.label,
    selected && variant === 'track' && styles.labelTrackSelected,
    selected && variant === 'accent' && styles.labelAccentSelected,
    selected && variant === 'chip' && styles.labelChipSelected,
  ];

  return (
    <TouchableOpacity
      style={pillStyles}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={segment.accessibilityLabel}
    >
      {segment.locked ? (
        <Lock
          size={13}
          color={
            selected
              ? variant === 'accent'
                ? THEME.colors.onGradient
                : THEME.colors.calm.lavenderDeep
              : THEME.colors.text.secondary
          }
        />
      ) : null}
      <Text style={labelStyles}>{segment.label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: THEME.spacing.xs,
  },
  rowTrack: {
    padding: THEME.spacing.xs / 2,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.mist,
  },
  rowAccent: {
    padding: THEME.spacing.xs / 2,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.card,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  chipRow: {
    flexDirection: 'row',
    gap: THEME.spacing.xs,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  pillTrack: {
    flex: 1,
    minHeight: THEME.sizes.touchTarget,
    paddingHorizontal: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.pill,
  },
  pillTrackSelected: {
    backgroundColor: THEME.colors.calm.card,
    ...THEME.shadows.soft,
  },
  pillAccent: {
    flex: 1,
    minHeight: THEME.sizes.touchTarget,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.pill,
  },
  pillAccentSelected: {
    backgroundColor: THEME.colors.calm.lavenderDeep,
  },
  pillChip: {
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 6,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.card,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    minHeight: 36,
  },
  pillChipSelected: {
    backgroundColor: THEME.colors.calm.lavender,
    borderColor: THEME.colors.calm.lavenderDeep,
  },
  label: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
  },
  labelTrackSelected: {
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
  labelAccentSelected: {
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
  },
  labelChipSelected: {
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
});
