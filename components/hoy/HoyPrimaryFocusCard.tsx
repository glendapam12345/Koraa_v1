import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Check, Sparkles, Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { CalmCard } from '@/components/ui/calm/CalmCard';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { useI18n } from '@/contexts/I18nContext';

type HoyPrimaryFocusCardProps = {
  content: string;
  completed: boolean;
  metaLabel?: string | null;
  onToggleComplete: () => void;
  onOpenDetails: () => void;
  /** Día 1: resalta un solo paso sin presión. */
  firstSessionNudge?: boolean;
  /** Evita tarjeta doble cuando ya hay un CalmCard padre. */
  embedded?: boolean;
};

/** Un solo foco del día — card grande al estilo mock. */
export function HoyPrimaryFocusCard({
  content,
  completed,
  metaLabel,
  onToggleComplete,
  onOpenDetails,
  firstSessionNudge = false,
  embedded = false,
}: HoyPrimaryFocusCardProps) {
  const { t } = useI18n();
  const nudge = firstSessionNudge && !completed;

  const inner = (
    <>
      <View style={styles.topRow}>
        <View style={[styles.eyebrowPill, nudge && styles.eyebrowPillNudge]}>
          {nudge ? (
            <Sparkles size={12} color={THEME.colors.calm.lavenderDeep} strokeWidth={2} />
          ) : (
            <Star
              size={12}
              color={THEME.colors.calm.lavenderDeep}
              fill={THEME.colors.calm.lavenderDeep}
            />
          )}
          <Text style={styles.eyebrow}>
            {nudge ? t('hoy.firstSessionMicroEyebrow') : t('hoy.todayFocusEyebrow')}
          </Text>
        </View>
      </View>

      {nudge ? <Text style={styles.nudgeHint}>{t('hoy.firstSessionMicroHint')}</Text> : null}

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

      {nudge ? (
        <CalmPrimaryButton
          label={t('hoy.firstSessionMicroCta')}
          onPress={onToggleComplete}
          variant="default"
          accessibilityHint={t('hoy.firstSessionMicroCtaHint')}
        />
      ) : (
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
      )}
    </>
  );

  if (nudge && !embedded) {
    return (
      <LinearGradient
        colors={[...THEME.colors.parami.moodCard]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.95, y: 1 }}
        style={[styles.nudgeShell, completed && styles.cardDone]}
      >
        {inner}
      </LinearGradient>
    );
  }

  if (embedded) {
    return <View style={[styles.embedded, completed && styles.cardDone]}>{inner}</View>;
  }

  return (
    <CalmCard
      variant="hero"
      style={[styles.card, completed && styles.cardDone, firstSessionNudge && styles.cardNudge]}
    >
      {inner}
    </CalmCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: THEME.spacing.sm,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.md,
    borderColor: THEME.colors.calm.border,
    borderWidth: 1,
  },
  embedded: {
    gap: THEME.spacing.sm,
  },
  nudgeShell: {
    gap: THEME.spacing.sm,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.borderRadius.xl,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  cardDone: {
    opacity: 0.72,
  },
  cardNudge: {
    borderColor: THEME.colors.tint.blue.border,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.card,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  eyebrowPillNudge: {
    backgroundColor: THEME.colors.calm.card,
    borderColor: THEME.colors.tint.blue.border,
  },
  eyebrow: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
    lineHeight: 16,
  },
  nudgeHint: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
    fontFamily: THEME.fonts.accent.italic,
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
  checkRingNudge: {
    borderColor: THEME.colors.calm.lavenderDeep,
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
