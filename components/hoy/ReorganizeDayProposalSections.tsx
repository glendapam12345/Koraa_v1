import { View, Text, StyleSheet } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { ReorganizeKeepItem, ReorganizeMoveItem } from '@/lib/lifeAreas/types';

type ReorganizeDayProposalSectionsProps = {
  kept: ReorganizeKeepItem[];
  moved: ReorganizeMoveItem[];
};

function MoveRow({ item }: { item: ReorganizeMoveItem }) {
  return (
    <View style={styles.row}>
      <Text style={styles.emoji}>{item.areaEmoji}</Text>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.moveMeta}>
          {item.fromLabel ? (
            <>
              <Text style={styles.moveFrom}>{item.fromLabel}</Text>
              <ArrowRight size={12} color={THEME.colors.calm.lavenderDeep} />
            </>
          ) : null}
          <Text style={styles.moveTo}>{item.toLabel}</Text>
        </View>
      </View>
    </View>
  );
}

function KeepRow({ item }: { item: ReorganizeKeepItem }) {
  return (
    <View style={styles.row}>
      <Text style={styles.emoji}>{item.areaEmoji}</Text>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {item.dateLabel ? <Text style={styles.keepDate}>{item.dateLabel}</Text> : null}
      </View>
    </View>
  );
}

export function ReorganizeDayProposalSections({ kept, moved }: ReorganizeDayProposalSectionsProps) {
  const { t } = useI18n();

  return (
    <View style={styles.wrap}>
      {kept.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('reorganizeDay.sectionKeep')}</Text>
          {kept.map((item) => (
            <KeepRow key={item.taskId} item={item} />
          ))}
        </View>
      ) : null}

      {moved.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('reorganizeDay.sectionMove')}</Text>
          {moved.map((item) => (
            <MoveRow key={item.taskId} item={item} />
          ))}
        </View>
      ) : null}

      {kept.length === 0 && moved.length === 0 ? (
        <Text style={styles.empty}>{t('reorganizeDay.emptyProposal')}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.md,
  },
  section: {
    gap: THEME.spacing.xs,
  },
  sectionTitle: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THEME.colors.calm.border,
  },
  emoji: {
    fontSize: 16,
    lineHeight: 22,
    width: 22,
    textAlign: 'center',
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
    lineHeight: 22,
  },
  keepDate: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
  },
  moveMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  moveFrom: {
    ...THEME.typography.caption,
    color: THEME.colors.text.tertiary,
    textDecorationLine: 'line-through',
  },
  moveTo: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
  },
  empty: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    fontStyle: 'italic',
    lineHeight: 22,
  },
});
