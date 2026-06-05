import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { RefreshCw, Feather, X } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

type HoyDayFlowSectionProps = {
  showDayChangedCard: boolean;
  showNothingDoneCard: boolean;
  focusTaskNames?: string[];
  onQuickRecheck: () => void;
  onDismissDayChanged: () => void;
  onLightenLoad: () => void;
};

export function HoyDayFlowSection({
  showDayChangedCard,
  showNothingDoneCard,
  focusTaskNames = [],
  onQuickRecheck,
  onDismissDayChanged,
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

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('hoyDayFlow.unifiedTitle')}</Text>
        {showDayChangedCard ? (
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

      {showNothingDoneCard && focusTaskNames.length > 0 ? (
        <View style={styles.focusListBlock}>
          <Text style={styles.focusListLabel}>{t('hoyDayFlow.focusListLabel')}</Text>
          {focusTaskNames.map((name) => (
            <View key={name} style={styles.focusListRow}>
              <View style={styles.focusBullet} />
              <Text style={styles.focusListItem} numberOfLines={2}>
                {name}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={onQuickRecheck}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t('hoyDayFlow.reorganizeCta')}
        >
          <RefreshCw size={18} color={THEME.colors.onGradient} />
          <Text style={styles.primaryBtnText}>{t('hoyDayFlow.reorganizeCta')}</Text>
        </TouchableOpacity>

        {showNothingDoneCard ? (
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={onLightenLoad}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={t('hoyDayFlow.lightenCta')}
          >
            <Feather size={18} color={THEME.colors.gradient.blue} />
            <Text style={styles.secondaryBtnText}>{t('hoyDayFlow.lightenCta')}</Text>
          </TouchableOpacity>
        ) : null}

        {showDayChangedCard ? (
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
