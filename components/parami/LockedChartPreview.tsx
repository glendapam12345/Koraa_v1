import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';

type LockedChartPreviewProps = {
  variant: 'mood' | 'energy' | 'symptoms';
};

export function LockedChartPreview({ variant }: LockedChartPreviewProps) {
  if (variant === 'mood') {
    return (
      <View
        style={styles.moodWrap}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      >
        {[40, 65, 45, 80, 55, 70, 50].map((h, i) => (
          <View
            key={i}
            style={[
              styles.moodBar,
              {
                height: h,
                backgroundColor:
                  i % 2 === 0 ? THEME.colors.calm.lavenderDeep : THEME.colors.gradient.pink,
              },
            ]}
          />
        ))}
      </View>
    );
  }

  if (variant === 'energy') {
    return (
      <View
        style={styles.energyWrap}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      >
        {[55, 72, 48, 85, 60, 78, 52, 68].map((h, i) => (
          <View key={i} style={[styles.energyBar, { height: h }]} />
        ))}
      </View>
    );
  }

  return (
    <View
      style={styles.symptomsWrap}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      <View style={styles.symptomEmojiRow}>
        {['🐼', '💤', '☁️', '😣', '🦉'].map((emoji, i) => (
          <Text key={i} style={styles.emojiText}>
            {emoji}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  moodWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 6,
    height: 88,
    paddingVertical: THEME.spacing.sm,
  },
  moodBar: {
    width: 10,
    borderRadius: 5,
    opacity: 0.85,
  },
  energyWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
    height: 88,
    paddingVertical: THEME.spacing.sm,
  },
  energyBar: {
    width: 14,
    borderRadius: 7,
    backgroundColor: THEME.colors.calm.lavenderDeep,
    opacity: 0.7,
  },
  symptomsWrap: {
    alignItems: 'center',
    paddingVertical: THEME.spacing.md,
    minHeight: 88,
  },
  symptomEmojiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: THEME.spacing.md,
  },
  emojiText: {
    fontSize: 32,
    opacity: 0.9,
  },
});
