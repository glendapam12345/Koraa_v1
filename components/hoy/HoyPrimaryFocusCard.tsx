import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Check, Star } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { CalmCard } from '@/components/ui/calm/CalmCard';
import { useI18n } from '@/contexts/I18nContext';

type HoyPrimaryFocusCardProps = {
  content: string;
  completed: boolean;
  metaLabel?: string | null;
  onToggleComplete: () => void;
  onOpenDetails: () => void;
};

/** Un solo foco del día — card grande al estilo mock. */
export function HoyPrimaryFocusCard({
  content,
  completed,
  metaLabel,
  onToggleComplete,
  onOpenDetails,
}: HoyPrimaryFocusCardProps) {
  const { t } = useI18n();

  return (
    <CalmCard style={[styles.card, completed && styles.cardDone]}>
      <View style={styles.topRow}>
        <Text style={styles.eyebrow}>{t('hoy.todayFocusEyebrow')}</Text>
        <Star
          size={18}
          color={THEME.colors.calm.lavenderDeep}
          fill={THEME.colors.calm.lavenderDeep}
        />
      </View>

      <TouchableOpacity
        onPress={onOpenDetails}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityLabel={t('hoy.focusTaskOpenA11y', { task: content })}
        accessibilityHint={t('hoy.focusTaskOpenHint')}
      >
        <Text style={[styles.title, completed && styles.titleDone]} numberOfLines={3}>
          {content}
        </Text>
        {metaLabel && !completed ? (
          <Text style={styles.meta} numberOfLines={1}>
            {metaLabel}
          </Text>
        ) : null}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.checkRow}
        onPress={onToggleComplete}
        activeOpacity={0.85}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: completed }}
        accessibilityLabel={t('hoy.focusTaskToggleA11y', { task: content })}
      >
        {completed ? (
          <View style={styles.checkDone}>
            <Check size={14} color={THEME.colors.onGradient} strokeWidth={3} />
          </View>
        ) : (
          <View style={styles.checkRing} />
        )}
        <Text style={styles.checkLabel}>
          {completed ? t('hoy.todayFocusDone') : t('hoy.todayFocusMark')}
        </Text>
      </TouchableOpacity>
    </CalmCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: THEME.spacing.sm,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.md,
    backgroundColor: THEME.colors.fill[100],
    borderColor: THEME.colors.calm.lavender,
    borderWidth: 1,
  },
  cardDone: {
    opacity: 0.72,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
    lineHeight: 18,
  },
  title: {
    ...THEME.typography.h3,
    fontSize: 22,
    lineHeight: 28,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  titleDone: {
    color: THEME.colors.text.secondary,
    textDecorationLine: 'line-through',
  },
  meta: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
    marginTop: 4,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: THEME.sizes.touchTarget,
    marginTop: 2,
  },
  checkRing: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: THEME.colors.calm.border,
    backgroundColor: THEME.colors.calm.card,
  },
  checkDone: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: THEME.colors.calm.lavenderDeep,
    borderWidth: 2,
    borderColor: THEME.colors.calm.lavenderDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkLabel: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.calm.lavenderDeep,
    lineHeight: 18,
  },
});
