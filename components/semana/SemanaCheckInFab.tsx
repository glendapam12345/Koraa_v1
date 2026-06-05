import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Heart } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

type SemanaCheckInFabProps = {
  onPress: () => void;
};

export function SemanaCheckInFab({ onPress }: SemanaCheckInFabProps) {
  const { t } = useI18n();

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <TouchableOpacity
        style={styles.bar}
        onPress={onPress}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={t('semana.checkInTodayFab')}
        accessibilityHint={t('semanaExtra.checkInTodayFabHint')}
      >
        <View style={styles.iconWrap}>
          <Heart size={18} color={THEME.colors.onGradient} fill={THEME.colors.onGradient} />
        </View>
        <Text style={styles.label}>{t('semana.checkInTodayFab')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: THEME.layout.screenPaddingX,
    right: THEME.layout.screenPaddingX,
    bottom: THEME.layout.floatingTabBarClearance,
    zIndex: 20,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.sm,
    backgroundColor: THEME.colors.calm.lavenderDeep,
    borderRadius: THEME.borderRadius.pill,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
    ...THEME.shadows.card,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...THEME.typography.body,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
  },
});
