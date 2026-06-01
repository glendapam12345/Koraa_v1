import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { RefreshCw, X } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

type HoyDayFlowSectionProps = {
  showDayChangedCard: boolean;
  showNothingDoneCard: boolean;
  onQuickRecheck: () => void;
  onDismissDayChanged: () => void;
  onLightenLoad: () => void;
};

export function HoyDayFlowSection({
  showDayChangedCard,
  showNothingDoneCard,
  onQuickRecheck,
  onDismissDayChanged,
  onLightenLoad,
}: HoyDayFlowSectionProps) {
  const { t } = useI18n();

  if (!showDayChangedCard && !showNothingDoneCard) return null;

  return (
    <>
      {showDayChangedCard ? (
        <View style={styles.dayFlowCard}>
          <View style={styles.dayFlowCardHeader}>
            <Text style={styles.dayFlowTitle}>{t('hoyDayFlow.dayChangedTitle')}</Text>
            <TouchableOpacity
              onPress={onDismissDayChanged}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={t('hoyDayFlow.dismissTodayA11y')}
            >
              <X size={20} color={THEME.colors.text.secondary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.dayFlowBody}>{t('hoyDayFlow.dayChangedBody')}</Text>
          <View style={styles.dayFlowActions}>
            <TouchableOpacity
              style={styles.dayFlowPrimaryBtn}
              onPress={onQuickRecheck}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t('hoyDayFlow.dayChangedCta')}
            >
              <RefreshCw size={18} color={THEME.colors.gradient.blue} />
              <Text style={styles.dayFlowPrimaryBtnText}>{t('hoyDayFlow.dayChangedCta')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dayFlowSecondaryBtn}
              onPress={onDismissDayChanged}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t('hoyDayFlow.dismissTodayA11y')}
            >
              <Text style={styles.dayFlowSecondaryBtnText}>{t('hoyDayFlow.dismissToday')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {showNothingDoneCard ? (
        <View style={[styles.dayFlowCard, styles.dayFlowCardMuted]}>
          <Text style={styles.dayFlowTitle}>{t('hoyDayFlow.nothingDoneTitle')}</Text>
          <Text style={styles.dayFlowBody}>{t('hoyDayFlow.nothingDoneBody')}</Text>
          <View style={styles.dayFlowActions}>
            <TouchableOpacity
              style={styles.dayFlowPrimaryBtn}
              onPress={onQuickRecheck}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t('hoyDayFlow.nothingDoneReorganize')}
            >
              <Text style={styles.dayFlowPrimaryBtnText}>{t('hoyDayFlow.nothingDoneReorganize')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dayFlowSecondaryBtn}
              onPress={onLightenLoad}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t('hoyDayFlow.nothingDoneLighten')}
            >
              <Text style={styles.dayFlowSecondaryBtnText}>{t('hoyDayFlow.nothingDoneLighten')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  dayFlowCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.xs,
  },
  dayFlowCard: {
    marginHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.fill[100],
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
    gap: THEME.spacing.xs,
    ...THEME.shadows.soft,
  },
  dayFlowCardMuted: {
    borderColor: THEME.colors.fill[200],
    backgroundColor: THEME.colors.fill[200],
  },
  dayFlowTitle: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    flex: 1,
  },
  dayFlowBody: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  dayFlowActions: {
    gap: THEME.spacing.xs,
    marginTop: THEME.spacing.xs,
  },
  dayFlowPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.xs,
    minHeight: THEME.sizes.touchTarget,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.fill[200],
  },
  dayFlowPrimaryBtnText: {
    ...THEME.typography.meta,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.gradient.blue,
  },
  dayFlowSecondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    borderRadius: THEME.borderRadius.pill,
  },
  dayFlowSecondaryBtnText: {
    ...THEME.typography.meta,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.secondary,
  },
});
