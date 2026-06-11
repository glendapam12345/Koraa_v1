import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Heart } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

type HoyCrisisBannerProps = {
  onDismiss: () => void;
};

export function HoyCrisisBanner({ onDismiss }: HoyCrisisBannerProps) {
  const { t } = useI18n();

  return (
    <View style={styles.wrap} accessibilityRole="summary" accessibilityLabel={t('hoy.crisisBannerTitle')}>
      <View style={styles.row}>
        <Heart size={16} color={THEME.colors.calm.lavenderDeep} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    backgroundColor: THEME.colors.calm.lavender,
    borderRadius: THEME.borderRadius.pill,
    paddingVertical: THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  title: {
    ...THEME.typography.caption,
    flex: 1,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
  },
  dismiss: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
  },
});
