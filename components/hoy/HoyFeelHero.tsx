import { View, Text, StyleSheet, Pressable } from 'react-native';
import { THEME } from '@/constants/theme';
import { CalmCard } from '@/components/ui/calm/CalmCard';
import { KoraaMascotAvatar } from '@/components/branding/KoraaMascotAvatar';
import { useI18n } from '@/contexts/I18nContext';
import type { TranslationKey } from '@/lib/i18n';

type HoyFeelHeroProps = {
  hasCheckIn: boolean;
  emotionEmoji?: string;
  emotionLabel?: string;
  energyLevel?: number;
  onUpdateFeel: () => void;
};

const ENERGY_WORD_KEYS: Record<1 | 2 | 3 | 4 | 5, TranslationKey> = {
  1: 'hoy.energyWord1',
  2: 'hoy.energyWord2',
  3: 'hoy.energyWord3',
  4: 'hoy.energyWord4',
  5: 'hoy.energyWord5',
};

function clampEnergy(level: number): 1 | 2 | 3 | 4 | 5 {
  const n = Math.round(level);
  if (n <= 1) return 1;
  if (n >= 5) return 5;
  return n as 2 | 3 | 4;
}

/**
 * Sin check-in: hero grande (CTA principal).
 * Con check-in: franja compacta — el foco del día es el protagonista.
 */
export function HoyFeelHero({
  hasCheckIn,
  emotionLabel = '',
  energyLevel = 0,
  onUpdateFeel,
}: HoyFeelHeroProps) {
  const { t } = useI18n();

  if (hasCheckIn && emotionLabel) {
    const level = energyLevel > 0 ? clampEnergy(energyLevel) : null;
    const energyLine = level
      ? t('hoy.energyTodayValue', { word: t(ENERGY_WORD_KEYS[level]), level })
      : emotionLabel;

    return (
      <Pressable
        onPress={onUpdateFeel}
        style={({ pressed }) => [styles.pressable, pressed && styles.pressablePressed]}
        accessibilityRole="button"
        accessibilityLabel={t('hoy.currentStateEditA11y')}
        accessibilityHint={t('hoy.feelHeroTapUpdate')}
      >
        <View style={styles.compactRow}>
          <View style={styles.compactMascot} accessibilityElementsHidden>
            <KoraaMascotAvatar size={44} variant="ellie" breathe />
          </View>
          <View style={styles.compactCopy}>
            <Text style={styles.compactEyebrow}>{t('hoy.energyTodayLabel')}</Text>
            <Text style={styles.compactHeadline} numberOfLines={1}>
              {energyLine}
            </Text>
            {level ? (
              <View style={styles.compactBarRow} accessibilityRole="progressbar">
                {[1, 2, 3, 4, 5].map((segment) => (
                  <View
                    key={segment}
                    style={[
                      styles.compactBarSegment,
                      segment <= level ? styles.barSegmentOn : styles.barSegmentOff,
                    ]}
                  />
                ))}
              </View>
            ) : null}
          </View>
          <Text style={styles.compactLink}>{t('hoy.updateFeel')}</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onUpdateFeel}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressablePressed]}
      accessibilityRole="button"
      accessibilityLabel={t('hoy.inicio.primaryCta')}
      accessibilityHint={t('hoy.feelHeroPurpose')}
    >
      <CalmCard variant="hero" style={[styles.card, styles.cardInvite]}>
        <View style={styles.inviteRow}>
          <View style={styles.inviteMascot} accessibilityElementsHidden>
            <KoraaMascotAvatar size={64} variant="ellie" breathe />
          </View>
          <View style={styles.inviteCopy}>
            <Text style={styles.inviteTitle}>{t('hoy.feelHeroQuestion')}</Text>
            <Text style={styles.koraaLine}>{t('hoy.feelHeroPurposeShort')}</Text>
            <Text style={styles.linkLine}>{t('hoy.feelHeroCompactCta')}</Text>
          </View>
        </View>
      </CalmCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
    borderRadius: THEME.borderRadius.xl,
  },
  pressablePressed: {
    opacity: 0.92,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.calm.lavender,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  compactMascot: {
    flexShrink: 0,
  },
  compactCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  compactEyebrow: {
    ...THEME.typography.meta,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
  },
  compactHeadline: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    lineHeight: 20,
  },
  compactBarRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 2,
    maxWidth: 120,
  },
  compactBarSegment: {
    flex: 1,
    height: 5,
    borderRadius: 3,
  },
  barSegmentOn: {
    backgroundColor: THEME.colors.calm.lavenderDeep,
  },
  barSegmentOff: {
    backgroundColor: THEME.colors.calm.border,
  },
  compactLink: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    flexShrink: 0,
  },
  card: {
    gap: THEME.spacing.sm,
  },
  cardInvite: {
    borderColor: THEME.colors.calm.border,
    borderWidth: 1,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.borderRadius.xl,
  },
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  inviteMascot: {
    flexShrink: 0,
  },
  inviteCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  inviteTitle: {
    ...THEME.typography.sectionTitle,
    fontSize: 20,
    lineHeight: 26,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  koraaLine: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  linkLine: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    marginTop: 2,
  },
});
