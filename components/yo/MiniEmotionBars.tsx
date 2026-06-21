import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { EmotionMixItem } from '@/lib/checkInPatterns';

type MiniEmotionBarsProps = {
  items: EmotionMixItem[];
};

export function MiniEmotionBars({ items }: MiniEmotionBarsProps) {
  const { t } = useI18n();
  const maxCount = Math.max(...items.map((i) => i.count), 1);

  if (items.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap} accessibilityLabel={t('paramiExtra.a11yEmotionMix')}>
      {items.map((item) => {
        const widthPct = Math.max(12, Math.round((item.count / maxCount) * 100));
        return (
          <View key={item.id} style={styles.row}>
            <Text style={styles.label} numberOfLines={1}>
              {t(`sentir.emotions.${item.id}` as 'sentir.emotions.tranquila')}
            </Text>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  { width: `${widthPct}%`, backgroundColor: item.color },
                ]}
              />
            </View>
            <Text style={styles.count}>{item.count}</Text>
          </View>
        );
      })}
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
    gap: THEME.spacing.xs,
  },
  label: {
    ...THEME.typography.small,
    color: THEME.colors.text.main,
    width: 72,
    fontFamily: THEME.fonts.heading.medium,
  },
  track: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: THEME.colors.calm.mist,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 5,
  },
  count: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    width: 20,
    textAlign: 'right',
    fontFamily: THEME.fonts.heading.bold,
  },
});
