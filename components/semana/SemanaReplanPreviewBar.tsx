import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { CalmCard } from '@/components/ui/calm/CalmCard';

type SemanaReplanPreviewBarProps = {
  headline?: string | null;
  subline?: string | null;
  usedAi?: boolean;
  loading?: boolean;
  applying?: boolean;
  onAccept: () => void;
  onCancel: () => void;
};

export function SemanaReplanPreviewBar({
  headline,
  subline,
  usedAi = false,
  loading = false,
  applying = false,
  onAccept,
  onCancel,
}: SemanaReplanPreviewBarProps) {
  const { t } = useI18n();

  return (
    <View style={styles.wrap}>
      <CalmCard style={styles.card}>
        <View style={styles.titleRow}>
          <Text style={styles.eyebrow}>{t('semana.replanEyebrow')}</Text>
          {usedAi ? (
            <View style={styles.aiPill}>
              <Text style={styles.aiPillText}>{t('semana.weeklyBriefAiBadge')}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.title}>{headline ?? t('semana.replanDefaultHeadline')}</Text>
        {subline ? <Text style={styles.subline}>{subline}</Text> : null}
        <Text style={styles.hint}>{t('semana.replanDragHint')}</Text>
      </CalmCard>

      <CalmPrimaryButton
        label={t('semana.replanAccept')}
        onPress={onAccept}
        loading={applying || loading}
        disabled={loading}
        large
      />
      <CalmPrimaryButton
        label={t('semana.replanCancel')}
        variant="soft"
        onPress={onCancel}
        disabled={applying || loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.sm,
  },
  card: {
    gap: THEME.spacing.xs,
    backgroundColor: THEME.colors.calm.mist,
    borderColor: THEME.colors.calm.lavender,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: THEME.spacing.xs,
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
  eyebrow: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  title: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    lineHeight: 22,
  },
  subline: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  hint: {
    ...THEME.typography.small,
    color: THEME.colors.text.tertiary,
    lineHeight: 16,
    marginTop: 2,
  },
});
