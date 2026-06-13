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
      accessibilityLabel={t('hoy.crisisBannerTitle')}
    >
      <View style={[styles.pill, fullWidth && styles.pillFull]}>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  title: {
    ...THEME.typography.meta,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    flexShrink: 1,
  },
  dot: {
    ...THEME.typography.meta,
    fontSize: 12,
    color: THEME.colors.text.tertiary,
  },
  learnMore: {
    ...THEME.typography.meta,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.calm.lavenderDeep,
  },
  dismiss: {
    ...THEME.typography.meta,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
  },
});
