import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { FrenteDashboardItem } from '@/lib/vnext/buildFrentesDashboard';

type FrenteDashboardCardProps = {
  front: FrenteDashboardItem;
  onPress?: () => void;
};

export function FrenteDashboardCard({ front, onPress }: FrenteDashboardCardProps) {
  const { t } = useI18n();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: front.backgroundColor,
          borderColor: front.borderColor,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.88}
      accessibilityRole="button"
      disabled={!onPress}
    >
      <Text style={styles.emoji}>{front.emoji}</Text>
      <Text style={[styles.name, { color: front.accentColor }]} numberOfLines={2}>
        {front.name}
      </Text>
      <Text style={styles.count}>
        {front.openTaskCount === 1
          ? t('frentes.chipCountOne')
          : t('frentes.chipCount', { count: front.openTaskCount })}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '47.5%',
    minHeight: 128,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: THEME.spacing.sm,
    gap: 6,
    justifyContent: 'space-between',
    ...THEME.shadows.soft,
  },
  emoji: {
    fontSize: THEME.typography.displayEmoji.fontSize,
    lineHeight: 32,
  },
  name: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    lineHeight: 22,
    flex: 1,
  },
  count: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 16,
  },
});
