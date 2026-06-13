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
    gap: 4,
    height: 56,
    paddingVertical: 4,
  },
  moodBar: {
    width: 8,
    borderRadius: 4,
    opacity: 0.85,
  },
  energyWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 6,
    height: 56,
    paddingVertical: 4,
  },
  energyBar: {
    width: 10,
    borderRadius: 5,
    backgroundColor: THEME.colors.calm.lavenderDeep,
    opacity: 0.7,
  },
  symptomsWrap: {
    alignItems: 'center',
    paddingVertical: 4,
    minHeight: 56,
  },
  symptomEmojiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: THEME.spacing.sm,
  },
  emojiText: {
    fontSize: 24,
    opacity: 0.9,
  },
});
