import type { ReactNode } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { CalmCard } from '@/components/ui/calm/CalmCard';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { useI18n } from '@/contexts/I18nContext';

type SemanaWeeklyBriefCardProps = {
  headline: string;
  summary: string;
  gentleAdvice: string;
  fromAi?: boolean;
  loading?: boolean;
  showAdjustCta?: boolean;
  adjustingWeek?: boolean;
  onAdjustWeek?: () => void;
  weekCapacitySlot?: ReactNode;
};

export function SemanaWeeklyBriefCard({
  headline,
  summary,
  gentleAdvice,
  fromAi = false,
  loading = false,
  showAdjustCta = false,
  adjustingWeek = false,
  onAdjustWeek,
  weekCapacitySlot,
}: SemanaWeeklyBriefCardProps) {
  const { t } = useI18n();

  if (!loading && !headline && !summary) return null;

  return (
    <CalmCard style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.eyebrowRow}>
          <Sparkles size={16} color={THEME.colors.calm.lavenderDeep} />
          <Text style={styles.eyebrow}>{t('semana.weeklyBriefEyebrow')}</Text>
        </View>
        {fromAi ? (
          <View style={styles.aiPill}>
            <Text style={styles.aiPillText}>{t('semana.weeklyBriefAiBadge')}</Text>
          </View>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={THEME.colors.calm.lavenderDeep} />
          <Text style={styles.loadingText}>{t('semana.weeklyBriefLoading')}</Text>
        </View>
      ) : (
        <>
          <Text style={styles.headline}>{headline}</Text>
          <Text style={styles.summary}>{summary}</Text>
          {gentleAdvice ? <Text style={styles.advice}>{gentleAdvice}</Text> : null}
          {weekCapacitySlot}
          {showAdjustCta && onAdjustWeek ? (
            <CalmPrimaryButton
              label={t('semana.weeklyBriefAdjustCta')}
              variant="soft"
              onPress={onAdjustWeek}
              loading={adjustingWeek}
              disabled={adjustingWeek}
              style={styles.cta}
            />
          ) : null}
        </>
      )}
    </CalmCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: THEME.spacing.xs,
    backgroundColor: THEME.colors.calm.mist,
    borderColor: THEME.colors.calm.lavender,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: THEME.spacing.xs,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  eyebrow: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  aiPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.lavender,
    borderWidth: 1,
    borderColor: THEME.colors.calm.lavenderDeep,
  },
  aiPillText: {
    ...THEME.typography.small,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.calm.lavenderDeep,
    lineHeight: 16,
  },
  headline: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    lineHeight: 22,
  },
  summary: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
  },
  advice: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.accent.italic,
    color: THEME.colors.text.main,
    lineHeight: 20,
    marginTop: 2,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    paddingVertical: THEME.spacing.xs,
  },
  loadingText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
  },
  cta: {
    marginTop: THEME.spacing.xs,
  },
});
