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

export function TipsCategoryGrid({
  order,
  labels,
  subtitles,
  counts,
  countBadges,
  tipsLabel,
  onPressCategory,
}: TipsCategoryGridProps) {
  const rowA: TipCategoryId[] = [order[0], order[1]];
  const rowB: TipCategoryId[] = [order[2], order[3]];

  const renderRow = (row: TipCategoryId[]) => (
    <View style={styles.row}>
      {row.map((category) => (
        <View key={category} style={styles.cell}>
          <TipsCategoryCard
            category={category}
            label={labels[category]}
            subtitle={subtitles?.[category]}
            tipCount={counts[category]}
            countBadge={countBadges?.[category]}
            tipsLabel={tipsLabel}
            onPress={() => onPressCategory(category)}
          />
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.grid}>
      {renderRow(rowA)}
      {renderRow(rowB)}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: THEME.spacing.sm,
    marginBottom: 0,
    alignSelf: 'stretch',
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
    alignItems: 'stretch',
  },
  cell: {
    flex: 1,
    minWidth: 0,
  },
});
