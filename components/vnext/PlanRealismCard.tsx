import { View, Text, StyleSheet } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { PlanRealismResult } from '@/lib/vnext/types';

type PlanRealismCardProps = {
  realism: PlanRealismResult;
};

export function PlanRealismCard({ realism }: PlanRealismCardProps) {
  const { t } = useI18n();

  return (
    <View style={[styles.card, !realism.isRealistic && styles.cardWarn]}>
      <View style={styles.header}>
        <Sparkles size={18} color={THEME.colors.calm.lavenderDeep} />
        <Text style={styles.title}>
          {realism.isRealistic
            ? t('vnext.realismOkTitle')
            : t('vnext.realismWarnTitle', {
                required: realism.requiredHours,
                available: realism.availableHours,
              })}
        </Text>
      </View>
      <Text style={styles.body}>
        {realism.isRealistic
          ? t('vnext.realismOkBody', { count: realism.todayTaskCount })
          : t('vnext.realismWarnBody', {
              today: realism.todayTaskCount,
              later: realism.postponedCount,
            })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...THEME.surfaces.tinted,
    padding: THEME.spacing.md,
    gap: 8,
    borderRadius: THEME.borderRadius.rounded,
  },
  cardWarn: {
    backgroundColor: THEME.colors.semantic.warnSoft,
    borderColor: THEME.colors.semantic.warnBorder,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  title: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    flex: 1,
    lineHeight: 22,
  },
  body: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
  },
});
