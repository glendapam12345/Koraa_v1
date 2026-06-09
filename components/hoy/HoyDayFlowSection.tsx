import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

type HoyDayFlowSectionProps = {
  showDayChangedCard: boolean;
  showNothingDoneCard: boolean;
  onDismissDayChanged: () => void;
  onQuickRecheck?: () => void;
  onLightenLoad?: () => void;
};

export function HoyDayFlowSection({
  showDayChangedCard,
  showNothingDoneCard,
  onDismissDayChanged,
  onQuickRecheck,
  onLightenLoad,
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
  const showActions = Boolean(onQuickRecheck || onLightenLoad);

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

      {showActions ? (
        <View style={styles.actions}>
          {onQuickRecheck ? (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={onQuickRecheck}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t('hoyDayFlow.reorganizeCta')}
            >
              <Text style={styles.primaryBtnText}>{t('hoyDayFlow.reorganizeCta')}</Text>
            </TouchableOpacity>
          ) : null}
          {onLightenLoad ? (
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={onLightenLoad}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t('hoyDayFlow.lightenCta')}
            >
              <Text style={styles.secondaryBtnText}>{t('hoyDayFlow.lightenCta')}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

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
