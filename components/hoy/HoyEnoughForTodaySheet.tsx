import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Sparkles, X } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';

type HoyEnoughForTodaySheetProps = {
  visible: boolean;
  completedCount: number;
  onClose: () => void;
};

export function HoyEnoughForTodaySheet({
  visible,
  completedCount,
  onClose,
}: HoyEnoughForTodaySheetProps) {
  const { t } = useI18n();

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
          >
            <X size={20} color={THEME.colors.text.secondary} />
          </TouchableOpacity>

          <View style={styles.iconWrap}>
            <Sparkles size={28} color={THEME.colors.calm.lavenderDeep} />
          </View>

          <Text style={styles.title}>{t('hoy.enoughSheetTitle')}</Text>
          <Text style={styles.body}>
            {t('hoy.enoughSheetBody', { count: completedCount })}
          </Text>
          <Text style={styles.sub}>{t('hoy.enoughSheetSub')}</Text>

          <CalmPrimaryButton
            label={t('hoy.enoughSheetCta')}
            onPress={onClose}
            variant="soft"
            accessibilityHint={t('hoy.enoughSheetCtaHint')}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    paddingHorizontal: THEME.layout.screenPaddingX,
  },
  sheet: {
    ...THEME.surfaces.elevated,
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.lg,
    gap: THEME.spacing.sm,
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: THEME.spacing.sm,
    right: THEME.spacing.sm,
    minWidth: THEME.sizes.touchTarget,
    minHeight: THEME.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: THEME.colors.calm.lavender,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: THEME.spacing.xs,
  },
  title: {
    ...THEME.typography.h3,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    textAlign: 'center',
    lineHeight: 28,
  },
  body: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    textAlign: 'center',
    lineHeight: 24,
  },
  sub: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: THEME.spacing.xs,
  },
});
