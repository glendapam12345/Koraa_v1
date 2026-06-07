import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

type HoyDayFlowSectionProps = {
  showDayChangedCard: boolean;
  showNothingDoneCard: boolean;
  onDismissDayChanged: () => void;
};

export function HoyDayFlowSection({
  showDayChangedCard,
  showNothingDoneCard,
  onDismissDayChanged,
}: HoyDayFlowSectionProps) {
  const { t } = useI18n();

  if (!showDayChangedCard && !showNothingDoneCard) return null;

  const bodyKey =
    showDayChangedCard && showNothingDoneCard
      ? 'hoyDayFlow.unifiedBodyBoth'
      : showNothingDoneCard
        ? 'hoyDayFlow.unifiedBodyNothingDone'
        : 'hoyDayFlow.unifiedBodyDayChanged';

  const canDismiss = showDayChangedCard || showNothingDoneCard;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('hoyDayFlow.unifiedTitle')}</Text>
        {canDismiss ? (
          <TouchableOpacity
            onPress={onDismissDayChanged}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={t('hoyDayFlow.dismissTodayA11y')}
          >
            <X size={20} color={THEME.colors.text.secondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      <Text style={styles.body}>{t(bodyKey)}</Text>

      {canDismiss ? (
        <TouchableOpacity
          style={styles.tertiaryBtn}
          onPress={onDismissDayChanged}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t('hoyDayFlow.dismissTodayA11y')}
        >
          <Text style={styles.tertiaryBtnText}>{t('hoyDayFlow.dismissToday')}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...THEME.surfaces.elevated,
    borderColor: THEME.colors.tint.blue.border,
    padding: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: THEME.spacing.sm,
  },
  title: {
    ...THEME.typography.h3,
    fontSize: 16,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    flex: 1,
  },
  body: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
  },
  focusListBlock: {
    gap: THEME.spacing.xs,
    paddingVertical: THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.sm,
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.standard,
  },
  focusListLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  focusListRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.xs,
  },
  focusBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.colors.gradient.blue,
    marginTop: 7,
  },
  focusListItem: {
    ...THEME.typography.body,
    flex: 1,
    color: THEME.colors.text.main,
    lineHeight: 22,
  },
  actions: {
    gap: THEME.spacing.xs,
    marginTop: THEME.spacing.xs,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.xs,
    minHeight: THEME.sizes.touchTarget,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.gradient.blue,
  },
  primaryBtnText: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.onGradient,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.xs,
    minHeight: THEME.sizes.touchTarget,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.fill[200],
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
  },
  secondaryBtnText: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.gradient.blue,
  },
  tertiaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    borderRadius: THEME.borderRadius.pill,
  },
  tertiaryBtnText: {
    ...THEME.typography.meta,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.secondary,
  },
});
