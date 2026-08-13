import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { useI18n } from '@/contexts/I18nContext';
import type { ScoredTip } from '@/lib/tipsPersonalization';

const BADGE_ROW_HEIGHT = 22;

type TipGridCardProps = {
  tip: ScoredTip;
  forYouLabel?: string;
  onPress?: () => void;
};

export function TipGridCard({ tip, forYouLabel, onPress }: TipGridCardProps) {
  const { t } = useI18n();
  const showBadge = Boolean(tip.forYou && forYouLabel);
  const a11yLabel = `${tip.title}${showBadge ? t('tipsExtra.a11yTipForYou') : ''}`;

  return (
    <TouchableOpacity
      style={styles.wrap}
      onPress={onPress}
      activeOpacity={0.9}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={a11yLabel}
      accessibilityHint={onPress ? t('tipsExtra.a11yTipOpenHint') : undefined}
    >
      <View style={styles.card}>
        <View style={styles.badgeRow}>
          {showBadge ? (
            <View style={styles.forYouPill}>
              <Text style={styles.forYouText}>{forYouLabel}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.emoji}>{tip.emoji}</Text>
        <Text style={styles.title} numberOfLines={2}>
          {tip.title}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

type TipDetailExpandedProps = {
  tip: ScoredTip;
  eyebrow?: string;
  /** CTA dentro de Koraa (Hoy / Tareas / focus). */
  actionLabel?: string;
  onAction?: () => void;
  /** Enlace secundario a app externa (opcional). */
  optionalAppLabel?: string;
  onOptionalApp?: () => void;
};

/** Consejo completo — vive en Koraa: por qué + cómo; apps externas solo opcionales. */
export function TipDetailExpanded({
  tip,
  eyebrow,
  actionLabel,
  onAction,
  optionalAppLabel,
  onOptionalApp,
}: TipDetailExpandedProps) {
  const { t } = useI18n();
  const howSteps = tip.howSteps ?? [];

  return (
    <LinearGradient
      colors={[...THEME.colors.calm.heroWash]}
      start={{ x: 0.05, y: 0 }}
      end={{ x: 0.95, y: 1 }}
      accessibilityRole="summary"
      accessibilityLabel={t('tipsExtra.a11yTipExpanded', { title: tip.title, body: tip.body })}
      style={styles.expanded}
    >
      {eyebrow ? (
        <View style={styles.eyebrowPill}>
          <Text style={styles.expandedEyebrow}>{eyebrow}</Text>
        </View>
      ) : null}
      <View style={styles.expandedHeader}>
        <View style={styles.emojiBubble}>
          <Text style={styles.expandedEmoji} importantForAccessibility="no" accessibilityElementsHidden>
            {tip.emoji}
          </Text>
        </View>
        <Text style={styles.expandedTitle}>{tip.title}</Text>
      </View>
      <Text style={styles.expandedBody}>{tip.body}</Text>

      {howSteps.length > 0 ? (
        <View style={styles.howBlock}>
          <View style={styles.howDividerRow}>
            <View style={styles.howLine} />
            <Text style={styles.howLabel}>{t('tips.howLabel')}</Text>
            <View style={styles.howLine} />
          </View>
          {howSteps.map((step, index) => (
            <View key={`${tip.id}-how-${index}`} style={styles.howRow}>
              <Text style={styles.howBullet} importantForAccessibility="no">
                ✦
              </Text>
              <Text style={styles.howStep}>{step}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {actionLabel && onAction ? (
        <CalmPrimaryButton label={actionLabel} onPress={onAction} variant="soft" />
      ) : null}

      {optionalAppLabel && onOptionalApp ? (
        <TouchableOpacity
          onPress={onOptionalApp}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={optionalAppLabel}
          style={styles.optionalAppBtn}
        >
          <Text style={styles.optionalAppText}>{optionalAppLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '48%',
    aspectRatio: 1,
    marginBottom: THEME.spacing.sm,
  },
  card: {
    flex: 1,
    ...THEME.surfaces.soft,
    borderRadius: THEME.borderRadius.rounded,
    paddingHorizontal: THEME.spacing.md,
    paddingBottom: THEME.spacing.md,
    ...THEME.shadows.soft,
  },
  badgeRow: {
    height: BADGE_ROW_HEIGHT,
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginTop: THEME.spacing.xs,
    marginBottom: THEME.spacing.xs,
  },
  forYouPill: {
    backgroundColor: THEME.colors.calm.card,
    borderRadius: THEME.borderRadius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: THEME.colors.calm.lavenderDeep,
  },
  forYouText: {
    ...THEME.typography.micro,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
  },
  emoji: {
    fontSize: THEME.typography.displayEmoji.fontSize,
    marginBottom: THEME.spacing.xs,
  },
  title: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    lineHeight: 20,
    flex: 1,
  },
  expanded: {
    borderRadius: THEME.borderRadius.rounded,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    gap: THEME.spacing.sm,
    ...THEME.shadows.soft,
  },
  eyebrowPill: {
    alignSelf: 'flex-start',
    backgroundColor: THEME.colors.calm.card,
    borderRadius: THEME.borderRadius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  expandedEyebrow: {
    ...THEME.typography.meta,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  expandedHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
  },
  emojiBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.calm.card,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  expandedEmoji: {
    fontSize: 22,
    lineHeight: 28,
  },
  expandedTitle: {
    ...THEME.typography.cardTitle,
    color: THEME.colors.text.main,
    flex: 1,
    lineHeight: 24,
    marginTop: 6,
  },
  expandedBody: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
  },
  howBlock: {
    gap: THEME.spacing.xs,
    marginTop: THEME.spacing.xs,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.surfaceOverlay.glass,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  howDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.xs,
  },
  howLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: THEME.colors.calm.lavenderDeep,
    opacity: 0.35,
  },
  howLabel: {
    ...THEME.typography.meta,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
  howRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.xs,
  },
  howBullet: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    lineHeight: 22,
    width: 14,
  },
  howStep: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    lineHeight: 22,
    flex: 1,
  },
  optionalAppBtn: {
    alignSelf: 'center',
    paddingVertical: THEME.spacing.xs,
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
  },
  optionalAppText: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.accent.italic,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});
