import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Heart, X } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';

type CareModeSheetProps = {
  visible: boolean;
  mode: 'activate' | 'deactivate';
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
};

const ACTIVATE_BULLET_KEYS = [
  'hoy.careModeActivateBullet1',
  'hoy.careModeActivateBullet2',
  'hoy.careModeActivateBullet3',
] as const;

export function CareModeSheet({
  visible,
  mode,
  onClose,
  onConfirm,
  loading = false,
}: CareModeSheetProps) {
  const { t } = useI18n();
  const activating = mode === 'activate';

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
          >
            <X size={22} color={THEME.colors.text.secondary} />
          </TouchableOpacity>

          <View style={styles.iconWrap}>
            <Heart
              size={28}
              color={THEME.colors.calm.lavenderDeep}
              fill={activating ? 'transparent' : THEME.colors.calm.lavender}
            />
          </View>

          <Text style={styles.title}>
            {activating ? t('hoy.careModeActivateTitle') : t('hoy.careModeDeactivateTitle')}
          </Text>
          <Text style={styles.lead}>
            {activating ? t('hoy.careModeActivateLead') : t('hoy.careModeDeactivateBody')}
          </Text>

          {activating ? (
            <View style={styles.bullets}>
              {ACTIVATE_BULLET_KEYS.map((key) => (
                <View key={key} style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>·</Text>
                  <Text style={styles.bulletText}>{t(key)}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <CalmPrimaryButton
            label={activating ? t('hoy.careModeActivateCta') : t('hoy.careModeDeactivateCta')}
            onPress={onConfirm}
            loading={loading}
            accessibilityHint={
              activating ? t('hoy.careModeActivateCtaHint') : t('settings.exitCareModeHint')
            }
          />

          {activating ? (
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.85}
              style={styles.cancelBtn}
              accessibilityRole="button"
              accessibilityLabel={t('hoy.careModeActivateCancel')}
            >
              <Text style={styles.cancelText}>{t('hoy.careModeActivateCancel')}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: THEME.colors.overlayStrong,
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.md,
  },
  content: {
    backgroundColor: THEME.colors.calm.card,
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    width: '100%',
    maxWidth: 400,
    gap: THEME.spacing.sm,
    ...THEME.shadows.soft,
  },
  closeButton: {
    position: 'absolute',
    top: THEME.spacing.sm,
    right: THEME.spacing.sm,
    padding: THEME.spacing.xs,
    zIndex: 1,
  },
  iconWrap: {
    alignSelf: 'center',
    marginTop: THEME.spacing.xs,
  },
  title: {
    ...THEME.typography.sectionTitle,
    lineHeight: 26,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    textAlign: 'center',
  },
  lead: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  bullets: {
    gap: 6,
    paddingVertical: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  bulletDot: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
    lineHeight: 20,
  },
  bulletText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    lineHeight: 20,
    flex: 1,
  },
  cancelBtn: {
    alignItems: 'center',
    minHeight: 40,
    justifyContent: 'center',
  },
  cancelText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
  },
});
