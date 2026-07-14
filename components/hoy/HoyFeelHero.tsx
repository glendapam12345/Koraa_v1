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

const ENERGY_CARE_KEYS: Record<1 | 2 | 3 | 4 | 5, TranslationKey> = {
  1: 'hoy.energyCare1',
  2: 'hoy.energyCare2',
  3: 'hoy.energyCare3',
  4: 'hoy.energyCare4',
  5: 'hoy.energyCare5',
};

function clampEnergy(level: number): 1 | 2 | 3 | 4 | 5 {
  const n = Math.round(level);
  if (n <= 1) return 1;
  if (n >= 5) return 5;
  return n as 2 | 3 | 4;
}

/** Hero de energía al estilo mock: mascota + nivel + mensaje suave. */
export function HoyFeelHero({
  hasCheckIn,
  emotionLabel = '',
  energyLevel = 0,
  onUpdateFeel,
}: HoyFeelHeroProps) {
  const { t } = useI18n();

  if (hasCheckIn && emotionLabel) {
    const level = energyLevel > 0 ? clampEnergy(energyLevel) : null;

    return (
      <Pressable
        onPress={onUpdateFeel}
        style={({ pressed }) => [styles.pressable, pressed && styles.pressablePressed]}
        accessibilityRole="button"
        accessibilityLabel={t('hoy.currentStateEditA11y')}
        accessibilityHint={t('hoy.feelHeroTapUpdate')}
      >
        <CalmCard style={[styles.card, styles.cardEnergy]}>
          <View style={styles.mascotCenter} accessibilityElementsHidden>
            <KoraaMascotAvatar size={80} />
          </View>
          <Text style={styles.energyEyebrowCentered}>{t('hoy.energyTodayLabel')}</Text>
          {level ? (
            <Text style={styles.energyHeadlineCentered}>
              {t('hoy.energyTodayValue', {
                word: t(ENERGY_WORD_KEYS[level]),
                level,
              })}
            </Text>
          ) : (
            <Text style={styles.energyHeadlineCentered}>{emotionLabel}</Text>
          )}
          {level ? (
            <View style={styles.barRow} accessibilityRole="progressbar">
              {[1, 2, 3, 4, 5].map((segment) => (
                <View
                  key={segment}
                  style={[
                    styles.barSegment,
                    segment <= level ? styles.barSegmentOn : styles.barSegmentOff,
                  ]}
                />
              ))}
            </View>
          ) : null}
          <Text style={styles.careLineCentered}>
            {level ? t(ENERGY_CARE_KEYS[level]) : t('hoy.feelHeroPurposeDone')}
          </Text>
          <Text style={styles.linkLineCentered}>{t('hoy.updateFeel')}</Text>
        </CalmCard>
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
      <CalmCard style={[styles.card, styles.cardInvite]}>
        <View style={styles.mascotCenter} accessibilityElementsHidden>
          <KoraaMascotAvatar size={88} />
        </View>
        <Text style={styles.inviteTitleCentered}>{t('hoy.feelHeroQuestion')}</Text>
        <Text style={styles.koraaLineCentered}>{t('hoy.feelHeroPurposeShort')}</Text>
        <Text style={styles.linkLineCentered}>{t('hoy.feelHeroCompactCta')}</Text>
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
  card: {
    gap: THEME.spacing.sm,
    alignItems: 'center',
  },
  cardEnergy: {
    backgroundColor: THEME.colors.calm.mist,
    borderColor: THEME.colors.calm.lavender,
    borderWidth: 1,
    paddingVertical: THEME.spacing.lg,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.borderRadius.xl,
  },
  cardInvite: {
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    borderColor: THEME.colors.tint.blue.border,
    borderWidth: 1,
    paddingVertical: THEME.spacing.lg,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.borderRadius.xl,
  },
  mascotCenter: {
    marginBottom: THEME.spacing.xs,
  },
  energyEyebrowCentered: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
  },
  energyHeadlineCentered: {
    ...THEME.typography.sectionTitle,
    fontSize: 22,
    lineHeight: 28,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    textAlign: 'center',
  },
  barRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
    alignSelf: 'stretch',
    maxWidth: 220,
  },
  barSegment: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },
  barSegmentOn: {
    backgroundColor: THEME.colors.calm.lavenderDeep,
  },
  barSegmentOff: {
    backgroundColor: THEME.colors.calm.border,
  },
  careLineCentered: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
    textAlign: 'center',
  },
  inviteTitleCentered: {
    ...THEME.typography.sectionTitle,
    fontSize: 24,
    lineHeight: 30,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    textAlign: 'center',
  },
  koraaLineCentered: {
    ...THEME.typography.body,
    lineHeight: 22,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
  },
  linkLineCentered: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.calm.lavenderDeep,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 4,
  },
});
