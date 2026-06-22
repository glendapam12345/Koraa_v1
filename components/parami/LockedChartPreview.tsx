import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { getEnergyLevelColor, getInsightsEmotionAccent } from '@/lib/insightsColors';
import { getEmotionEmoji } from '@/lib/emotionEmoji';

type LockedChartPreviewProps = {
  variant: 'mood' | 'energy' | 'symptoms';
};

const PREVIEW_MOOD_EMOTIONS = ['ansiosa', 'tranquila', 'agotada', 'tranquila', 'motivada', 'enfocada', 'tranquila'];
const PREVIEW_ENERGY_LEVELS = [4, 3, 2, 4, 3, 4, 2];
const PREVIEW_SYMPTOM_EMOTIONS = ['ansiosa', 'tranquila', 'agotada', 'enfocada', 'motivada'];

export function LockedChartPreview({ variant }: LockedChartPreviewProps) {
  if (variant === 'mood') {
    return (
      <View
        style={styles.moodWrap}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      >
        {PREVIEW_MOOD_EMOTIONS.map((emotion, i) => (
          <View key={i} style={styles.moodCell}>
            <View
              style={[
                styles.moodFace,
                {
                  borderColor: getInsightsEmotionAccent(emotion),
                },
              ]}
            >
              <Text style={styles.moodEmoji}>{getEmotionEmoji(emotion)}</Text>
            </View>
          </View>
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
        {PREVIEW_ENERGY_LEVELS.map((level, i) => {
          const widthPct = Math.max(18, level * 18);
          return (
            <View key={i} style={styles.energyRow}>
              <View style={styles.energyTrack}>
                <View
                  style={[
                    styles.energyFill,
                    {
                      width: `${widthPct}%`,
                      backgroundColor: getEnergyLevelColor(level),
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
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
        {PREVIEW_SYMPTOM_EMOTIONS.map((emotion, i) => (
          <View key={i} style={styles.symptomCell}>
            <View
              style={[
                styles.symptomRing,
                { borderColor: getInsightsEmotionAccent(emotion) },
              ]}
            >
              <Text style={styles.emojiText}>{getEmotionEmoji(emotion)}</Text>
            </View>
            <Text style={styles.symptomPct}>{[28, 24, 20, 16, 12][i]}%</Text>
          </View>
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
    paddingVertical: 4,
  },
  moodCell: {
    alignItems: 'center',
  },
  moodFace: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.fill[100],
    opacity: 0.65,
  },
  moodEmoji: {
    fontSize: 14,
    lineHeight: 16,
  },
  energyWrap: {
    gap: 4,
    paddingVertical: 4,
    justifyContent: 'center',
    minHeight: 56,
  },
  energyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  energyTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.colors.calm.mist,
    overflow: 'hidden',
    opacity: 0.65,
  },
  energyFill: {
    height: '100%',
    borderRadius: 4,
  },
  symptomsWrap: {
    alignItems: 'center',
    paddingVertical: 4,
    minHeight: 56,
  },
  symptomEmojiRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  symptomCell: {
    alignItems: 'center',
    gap: 2,
  },
  symptomRing: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.fill[100],
    opacity: 0.65,
  },
  emojiText: {
    fontSize: 14,
    lineHeight: 16,
  },
  symptomPct: {
    ...THEME.typography.tiny,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.secondary,
    opacity: 0.65,
  },
});
