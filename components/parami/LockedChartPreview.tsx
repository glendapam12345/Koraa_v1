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
        {[55, 72, 48, 85, 60, 78, 52].map((h, i) => (
          <View key={i} style={styles.energyCell}>
            <View
              style={[
                styles.energyBar,
                {
                  height: h,
                  backgroundColor:
                    i % 2 === 0 ? THEME.colors.calm.lavenderDeep : THEME.colors.gradient.blue,
                },
              ]}
            />
          </View>
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
    opacity: 0.5,
  },
  energyWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
    height: 56,
    paddingVertical: 4,
  },
  energyCell: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 56,
  },
  energyBar: {
    width: 8,
    borderRadius: 4,
    opacity: 0.65,
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
    fontSize: THEME.typography.displayEmojiMd.fontSize,
    opacity: 0.65,
  },
});
