import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

export type VaciarTabSegment = 'capture' | 'projects';

type VaciarTabSegmentsProps = {
  value: VaciarTabSegment;
  onChange: (segment: VaciarTabSegment) => void;
};

export function VaciarTabSegments({ value, onChange }: VaciarTabSegmentsProps) {
  const { t } = useI18n();

  const segments: { id: VaciarTabSegment; label: string; a11y: string }[] = [
    { id: 'capture', label: t('vaciar.segmentCapture'), a11y: t('vaciar.segmentCaptureA11y') },
    { id: 'projects', label: t('vaciar.segmentProjects'), a11y: t('vaciar.segmentProjectsA11y') },
  ];

  return (
    <View style={styles.row} accessibilityRole="tablist">
      {segments.map((segment) => {
        const selected = value === segment.id;
        return (
          <TouchableOpacity
            key={segment.id}
            style={[styles.pill, selected && styles.pillSelected]}
            onPress={() => onChange(segment.id)}
            activeOpacity={0.85}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={segment.a11y}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{segment.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: THEME.spacing.xs,
    padding: 4,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.fill[200],
  },
  pill: {
    flex: 1,
    minHeight: THEME.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.pill,
  },
  pillSelected: {
    backgroundColor: THEME.colors.fill[100],
    ...THEME.shadows.soft,
  },
  label: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.secondary,
  },
  labelSelected: {
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
});
