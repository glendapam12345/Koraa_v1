import { View, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { TipsCategoryCard } from '@/components/tips/TipsCategoryCard';
import type { TipCategoryId } from '@/lib/tipsTypes';

type TipsCategoryGridProps = {
  order: TipCategoryId[];
  labels: Record<TipCategoryId, string>;
  subtitles?: Partial<Record<TipCategoryId, string>>;
  counts: Record<TipCategoryId, number>;
  countBadges?: Partial<Record<TipCategoryId, string>>;
  tipsLabel: string;
  onPressCategory: (category: TipCategoryId) => void;
};

/** Grid 2×N — limpio, con aire, como catálogo visual de tips. */
export function TipsCategoryGrid({
  order,
  labels,
  counts,
  countBadges,
  tipsLabel,
  onPressCategory,
}: TipsCategoryGridProps) {
  const rows: TipCategoryId[][] = [];
  for (let i = 0; i < order.length; i += 2) {
    rows.push(order.slice(i, i + 2));
  }

  return (
    <View style={styles.grid}>
      {rows.map((row) => (
        <View key={row.join('-')} style={styles.row}>
          {row.map((category) => (
            <TipsCategoryCard
              key={category}
              category={category}
              label={labels[category]}
              tipCount={counts[category]}
              countBadge={countBadges?.[category]}
              tipsLabel={tipsLabel}
              onPress={() => onPressCategory(category)}
            />
          ))}
          {row.length === 1 ? <View style={styles.spacer} /> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: THEME.spacing.md,
    alignSelf: 'stretch',
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    gap: THEME.spacing.md,
    alignItems: 'stretch',
  },
  spacer: {
    flex: 1,
    minWidth: 0,
  },
});
