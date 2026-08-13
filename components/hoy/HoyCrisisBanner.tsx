import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Heart } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

type HoyCrisisBannerProps = {
  onDismiss: () => void;
  onLearnMore: () => void;
  /** Ocupa todo el ancho cuando va al inicio del contenido de Hoy. */
  fullWidth?: boolean;
};

export function HoyCrisisBanner({ onDismiss, onLearnMore, fullWidth = false }: HoyCrisisBannerProps) {
  const { t } = useI18n();

  return (
    <View
      style={[styles.wrap, fullWidth && styles.wrapFull]}
      accessibilityRole="summary"
      accessibilityLabel={`${t('hoy.crisisBannerTitle')}. ${t('hoy.crisisBannerSub')}`}
    >
      <View style={[styles.pill, fullWidth && styles.pillFull]}>
        <View style={styles.pillRow}>
          <Heart
            size={14}
            color={THEME.colors.calm.lavenderDeep}
            fill={THEME.colors.calm.lavenderDeep}
          />
          <Text style={styles.title} numberOfLines={1}>
            {t('hoy.crisisBannerTitle')}
          </Text>
          <Text style={styles.dot} accessibilityElementsHidden>
            ·
          </Text>
          <TouchableOpacity
            onPress={onLearnMore}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            accessibilityRole="button"
            accessibilityLabel={t('hoy.careModeHowItWorks')}
            accessibilityHint={t('hoy.careModeHowItWorksHint')}
          >
            <Text style={styles.learnMore}>{t('hoy.careModeHowItWorksShort')}</Text>
          </TouchableOpacity>
          <Text style={styles.dot} accessibilityElementsHidden>
            ·
          </Text>
          <TouchableOpacity
            onPress={onDismiss}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            accessibilityRole="button"
            accessibilityLabel={t('hoy.crisisBannerDismiss')}
          >
            <Text style={styles.dismiss}>{t('hoy.crisisBannerDismissShort')}</Text>
          </TouchableOpacity>
        </View>
        {fullWidth ? (
          <Text style={styles.sub}>{t('hoy.crisisBannerSub')}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'flex-end',
    maxWidth: '100%',
  },
  wrapFull: {
    alignSelf: 'stretch',
  },
  pill: {
    backgroundColor: THEME.colors.calm.lavender,
    borderRadius: THEME.borderRadius.pill,
    paddingVertical: 6,
    paddingHorizontal: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  pillFull: {
    borderRadius: THEME.borderRadius.rounded,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    gap: 4,
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  sub: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
    fontFamily: THEME.fonts.accent.italic,
  },
  title: {
    ...THEME.typography.small,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    flexShrink: 1,
  },
  dot: {
    ...THEME.typography.small,
    color: THEME.colors.text.tertiary,
  },
  learnMore: {
    ...THEME.typography.small,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.calm.lavenderDeep,
  },
  dismiss: {
    ...THEME.typography.small,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
  },
});
