import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Sparkles } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { CalmCard } from '@/components/ui/calm/CalmCard';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { useI18n } from '@/contexts/I18nContext';

type HoyProactiveNudgeCardProps = {
  title: string;
  body: string;
  ctaLabel: string;
  onCta: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  onDismiss?: () => void;
  icon?: LucideIcon;
};

/** Tarjeta proactiva unificada — Koraa sugiere el siguiente paso sin presión. */
export function HoyProactiveNudgeCard({
  title,
  body,
  ctaLabel,
  onCta,
  secondaryLabel,
  onSecondary,
  onDismiss,
  icon: Icon = Sparkles,
}: HoyProactiveNudgeCardProps) {
  const { t } = useI18n();

  return (
    <CalmCard style={styles.card}>
      <View style={styles.headerRow}>
        <Icon size={18} color={THEME.colors.calm.lavenderDeep} />
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={styles.body}>{body}</Text>
      <CalmPrimaryButton
        label={ctaLabel}
        variant="soft"
        onPress={onCta}
        accessibilityLabel={ctaLabel}
      />
      {secondaryLabel && onSecondary ? (
        <Pressable
          onPress={onSecondary}
          style={({ pressed }) => [styles.secondaryBtn, pressed && styles.secondaryPressed]}
          accessibilityRole="button"
          accessibilityLabel={secondaryLabel}
        >
          <Text style={styles.secondaryLabel}>{secondaryLabel}</Text>
        </Pressable>
      ) : null}
      {onDismiss ? (
        <Pressable
          onPress={onDismiss}
          style={({ pressed }) => [styles.dismissBtn, pressed && styles.secondaryPressed]}
          accessibilityRole="button"
          accessibilityLabel={t('hoy.proactiveNudgeDismissA11y')}
        >
          <Text style={styles.dismissLabel}>{t('hoy.proactiveNudgeDismiss')}</Text>
        </Pressable>
      ) : null}
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
    gap: THEME.spacing.xs,
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
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: THEME.spacing.xs,
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
  },
  secondaryLabel: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.calm.lavenderDeep,
  },
  dismissBtn: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  dismissLabel: {
    ...THEME.typography.small,
    color: THEME.colors.text.tertiary,
  },
  secondaryPressed: {
    opacity: 0.7,
  },
});
