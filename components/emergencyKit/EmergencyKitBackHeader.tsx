import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { ScreenHeader } from '@/components/ui/ScreenHeader';

type EmergencyKitBackHeaderProps = {
  title: string;
  subtitle?: string;
};

export function EmergencyKitBackHeader({ title, subtitle }: EmergencyKitBackHeaderProps) {
  const { t } = useI18n();

  return (
    <View style={styles.row}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.back}
        accessibilityLabel={t('common.back')}
        activeOpacity={0.7}
      >
        <ChevronLeft size={28} color={THEME.colors.text.main} />
      </TouchableOpacity>
      <View style={styles.header}>
        <ScreenHeader title={title} subtitle={subtitle} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.xs,
  },
  back: {
    paddingTop: 2,
    minWidth: THEME.sizes.touchTarget,
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
  },
  header: {
    flex: 1,
    minWidth: 0,
  },
});
