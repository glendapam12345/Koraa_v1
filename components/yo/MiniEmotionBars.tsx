import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { EmotionMixItem } from '@/lib/checkInPatterns';
import { getEmotionEmoji } from '@/lib/emotionEmoji';
import { getInsightsEmotionAccent } from '@/lib/insightsColors';

type MiniEmotionBarsProps = {
  items: EmotionMixItem[];
};

export function MiniEmotionBars({ items }: MiniEmotionBarsProps) {
  const { t } = useI18n();

  if (items.length === 0) {
    return null;
  }

  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <View style={styles.wrap} accessibilityLabel={t('paramiExtra.a11yEmotionMix')}>
      <View style={styles.emojiRow}>
        {items.map((item) => {
          const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
          const accent = getInsightsEmotionAccent(item.id);
          return (
            <View key={item.id} style={styles.emojiCell}>
              <View style={[styles.emojiRing, { borderColor: accent }]}>
                <Text style={styles.emoji} accessibilityElementsHidden importantForAccessibility="no">
                  {getEmotionEmoji(item.id)}
                </Text>
              </View>
              <Text style={styles.percent}>{pct}%</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.xs,
    paddingTop: 2,
  },
  emojiRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: THEME.spacing.xs,
  },
  emojiCell: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  emojiRing: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.fill[100],
  },
  emoji: {
    fontSize: 24,
    lineHeight: 28,
  },
  percent: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    lineHeight: 18,
  },
});
