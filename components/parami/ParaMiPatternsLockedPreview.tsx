import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import { CalmCard } from '@/components/ui/calm/CalmCard';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { openPaywall } from '@/lib/paywallNavigation';
import { LockedChartPreview } from '@/components/parami/LockedChartPreview';

type ParaMiPatternsLockedPreviewProps = {
  moodTitle: string;
  paywallReturnTo?: string;
};

export function ParaMiPatternsLockedPreview({
  moodTitle,
  paywallReturnTo = '/(tabs)/parami',
}: ParaMiPatternsLockedPreviewProps) {
  const { t } = useI18n();

  return (
    <CalmCard style={styles.card}>
      <View style={styles.header}>
        <Sparkles size={14} color={THEME.colors.calm.lavenderDeep} />
        <Text style={styles.headerTitle}>{t('parami.patternsLockedTitle')}</Text>
      </View>
      <Text style={styles.headerBody}>{t('parami.patternsLockedBody')}</Text>

      <View style={styles.rows}>
        <View style={styles.row}>
          <Text style={styles.rowLabel} numberOfLines={1}>
            {moodTitle}
          </Text>
          <View style={styles.preview}>
            <LockedChartPreview variant="mood" />
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.rowLabel} numberOfLines={1}>
            {t('yo.patternEnergyTitle')}
          </Text>
          <View style={styles.preview}>
            <LockedChartPreview variant="energy" />
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.rowLabel} numberOfLines={1}>
            {t('parami.symptomsCardTitle')}
          </Text>
          <View style={styles.preview}>
            <LockedChartPreview variant="symptoms" />
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.cta}
        onPress={() => openPaywall(router, paywallReturnTo)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={t('parami.patternUnlockA11y')}
        accessibilityHint={t('paramiExtra.a11yUnlockHint')}
      >
        <Text style={styles.ctaText}>{t('parami.patternsLockedCta')}</Text>
      </TouchableOpacity>
    </CalmCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: THEME.spacing.sm,
    padding: THEME.spacing.md,
    backgroundColor: THEME.colors.calm.mist,
    borderColor: THEME.colors.calm.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
    flex: 1,
  },
  headerBody: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
  },
  rows: {
    gap: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
  },
  row: {
    gap: 4,
  },
  rowLabel: {
    ...THEME.typography.meta,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
  },
  preview: {
    opacity: 0.55,
    transform: [{ scale: 0.92 }],
  },
  divider: {
    height: 1,
    backgroundColor: THEME.colors.calm.border,
  },
  cta: {
    alignSelf: 'center',
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.card,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
  },
  ctaText: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
    textAlign: 'center',
  },
});
