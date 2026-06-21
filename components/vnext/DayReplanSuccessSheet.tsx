import { Modal, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import { X } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { ReorganizeSuccessPanel } from '@/components/tasks/experience/ReorganizeSuccessPanel';
import type { ReorganizeWeekProposal } from '@/lib/lifeAreas/types';

type DayReplanSuccessSheetProps = {
  visible: boolean;
  proposal: ReorganizeWeekProposal | null;
  onDismiss: () => void;
  onViewCalendar?: () => void;
};

export function DayReplanSuccessSheet({
  visible,
  proposal,
  onDismiss,
  onViewCalendar,
}: DayReplanSuccessSheetProps) {
  const { t } = useI18n();

  if (!proposal) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <TouchableOpacity
            onPress={onDismiss}
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel={t('vnext.replanSuccessDismiss')}
          >
            <X size={22} color={THEME.colors.text.secondary} />
          </TouchableOpacity>
          <View style={styles.panelWrap}>
            <ReorganizeSuccessPanel
              result={proposal}
              onViewWeek={onViewCalendar ?? onDismiss}
              actionLabel={t('vnext.replanViewCalendar')}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: THEME.colors.overlayLight,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: THEME.colors.calm.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.xs,
    paddingBottom: THEME.spacing.lg,
    maxHeight: '92%',
  },
  closeBtn: {
    alignSelf: 'flex-end',
    width: THEME.sizes.touchTarget,
    height: THEME.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.xs,
  },
  panelWrap: {
    maxHeight: '100%',
    minHeight: 280,
  },
});
