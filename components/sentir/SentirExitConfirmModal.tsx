import { Modal, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { THEME } from '@/constants/theme';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { useI18n } from '@/contexts/I18nContext';

type SentirExitConfirmModalProps = {
  visible: boolean;
  onStay: () => void;
  onLeave: () => void;
};

export function SentirExitConfirmModal({ visible, onStay, onLeave }: SentirExitConfirmModalProps) {
  const { t } = useI18n();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onStay}
      accessibilityViewIsModal
    >
      <Pressable style={styles.backdrop} onPress={onStay} accessibilityLabel={t('sentir.exitConfirmStay')}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title} accessibilityRole="header">
            {t('sentir.exitConfirmTitle')}
          </Text>
          <Text style={styles.body}>{t('sentir.exitConfirmBody')}</Text>
          <CalmPrimaryButton
            label={t('sentir.exitConfirmStay')}
            onPress={onStay}
            accessibilityHint={t('sentirExtra.exitConfirmStayHint')}
          />
          <TouchableOpacity
            onPress={onLeave}
            style={styles.leaveBtn}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={t('sentir.exitConfirmLeave')}
            accessibilityHint={t('sentirExtra.exitConfirmLeaveHint')}
          >
            <Text style={styles.leaveText}>{t('sentir.exitConfirmLeave')}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: THEME.layout.screenPaddingX,
  },
  card: {
    ...THEME.surfaces.elevated,
    borderRadius: THEME.borderRadius.xl,
    padding: THEME.spacing.lg,
    gap: THEME.spacing.md,
  },
  title: {
    ...THEME.typography.h2,
    color: THEME.colors.text.main,
    textAlign: 'center',
  },
  body: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  leaveBtn: {
    alignSelf: 'center',
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
  },
  leaveText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
  },
});
