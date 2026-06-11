import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Heart, X } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';

type HoyCrisisBannerProps = {
  supportSnippet?: string;
  onDismiss: () => void;
  onOpenKit: () => void;
};

export function HoyCrisisBanner({ supportSnippet, onDismiss, onOpenKit }: HoyCrisisBannerProps) {
  const { t } = useI18n();

  return (
    <View style={styles.wrap} accessibilityRole="summary">
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.titleRow}>
            <Heart size={18} color={THEME.colors.calm.lavenderDeep} />
            <Text style={styles.title}>{t('hoy.crisisBannerTitle')}</Text>
          </View>
          <TouchableOpacity
            onPress={onDismiss}
            accessibilityLabel={t('hoy.crisisBannerDismiss')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={20} color={THEME.colors.text.tertiary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.body}>
          {supportSnippet?.trim() || t('hoy.crisisBannerBody')}
        </Text>
        <CalmPrimaryButton
          label={t('hoy.crisisBannerCta')}
          onPress={onOpenKit}
          variant="soft"
          accessibilityHint={t('hoy.crisisBannerCtaHint')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch',
  },
  card: {
    backgroundColor: THEME.colors.calm.lavender,
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    gap: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: THEME.spacing.sm,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
  },
  title: {
    ...THEME.typography.h3,
    flex: 1,
  },
  body: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
  },
});
