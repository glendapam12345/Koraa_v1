import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Heart } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

type HoyCrisisBannerProps = {
  onDismiss: () => void;
  onLearnMore: () => void;
};

export function HoyCrisisBanner({ onDismiss, onLearnMore }: HoyCrisisBannerProps) {
  const { t } = useI18n();

  return (
    <View
      style={styles.wrap}
      accessibilityRole="summary"
      accessibilityLabel={t('hoy.crisisBannerTitle')}
    >
      <View style={styles.row}>
        <Heart size={16} color={THEME.colors.calm.lavenderDeep} fill={THEME.colors.calm.lavender} />
        <View style={styles.textCol}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{t('hoy.crisisBannerTitle')}</Text>
            <TouchableOpacity
              onPress={onDismiss}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={t('hoy.crisisBannerDismiss')}
            >
              <Text style={styles.dismiss}>{t('hoy.crisisBannerDismissShort')}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={onLearnMore}
            hitSlop={{ top: 4, bottom: 4, left: 0, right: 0 }}
            accessibilityRole="button"
            accessibilityLabel={t('hoy.careModeHowItWorks')}
            accessibilityHint={t('hoy.careModeHowItWorksHint')}
          >
            <Text style={styles.learnMore}>{t('hoy.careModeHowItWorks')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.xs,
    backgroundColor: THEME.colors.calm.lavender,
    borderRadius: THEME.borderRadius.pill,
    paddingVertical: THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  textCol: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: THEME.spacing.xs,
  },
  title: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    flex: 1,
  },
  learnMore: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.calm.lavenderDeep,
    textDecorationLine: 'underline',
  },
  dismiss: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
  },
});
