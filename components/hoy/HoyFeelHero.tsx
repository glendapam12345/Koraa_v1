import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { CalmCard } from '@/components/ui/calm/CalmCard';
import { HoyStepBadge } from '@/components/hoy/HoyStepBadge';

type HoyFeelHeroProps = {
  hasCheckIn: boolean;
  emotionEmoji?: string;
  emotionLabel?: string;
  energyLevel?: number;
  onUpdateFeel: () => void;
};

export function HoyFeelHero({
  hasCheckIn,
  emotionEmoji = '💜',
  emotionLabel = '',
  energyLevel = 0,
  onUpdateFeel,
}: HoyFeelHeroProps) {
  const { t } = useI18n();

  const statusLine = hasCheckIn && emotionLabel
    ? energyLevel > 0
      ? `${emotionLabel} · ${t('hoy.feelHeroEnergy', { level: energyLevel })}`
      : emotionLabel
    : t('hoy.feelHeroCompactSub');

  return (
    <TouchableOpacity
      onPress={onUpdateFeel}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={t('hoy.currentStateEditA11y')}
      accessibilityHint={hasCheckIn ? t('hoy.feelHeroTapUpdate') : t('hoy.inicio.primaryCta')}
    >
      <CalmCard style={styles.card}>
        <View style={styles.emojiWrap}>
          <Text style={styles.emoji}>{hasCheckIn ? emotionEmoji : '💜'}</Text>
        </View>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <HoyStepBadge step={1} />
            <Text style={styles.title}>{t('hoy.feelHeroQuestion')}</Text>
          </View>
          <Text style={styles.purpose} numberOfLines={2}>
            {hasCheckIn ? t('hoy.feelHeroPurposeDone') : t('hoy.feelHeroPurpose')}
          </Text>
          <Text style={styles.status} numberOfLines={1}>
            {statusLine}
          </Text>
        </View>

        <View style={styles.trailing}>
          <Text style={styles.action}>
            {hasCheckIn ? t('hoy.currentStateEdit') : t('hoy.feelHeroCompactCta')}
          </Text>
          <ChevronRight size={16} color={THEME.colors.calm.lavenderDeep} />
        </View>
      </CalmCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: THEME.spacing.sm,
  },
  emojiWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.colors.calm.lavender,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  emoji: {
    fontSize: THEME.typography.displayEmojiMd.fontSize,
    lineHeight: 26,
  },
  body: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    lineHeight: 18,
    flex: 1,
  },
  purpose: {
    ...THEME.typography.meta,
    color: THEME.colors.calm.lavenderDeep,
    lineHeight: 15,
  },
  status: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
    lineHeight: 15,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
  },
  action: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    lineHeight: 16,
  },
});
