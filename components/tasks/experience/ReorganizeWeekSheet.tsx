import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { X, Sparkles } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { ReorganizeProposalList } from '@/components/tasks/experience/ReorganizeProposalList';
import type { ReorganizeWeekProposal } from '@/lib/lifeAreas/types';

type ReorganizeWeekSheetProps = {
  visible: boolean;
  proposal: ReorganizeWeekProposal;
  onAccept?: () => void;
  onClose: () => void;
};

/** Propuesta visual de reorganización — sin lógica de aplicar cambios aún. */
export function ReorganizeWeekSheet({
  visible,
  proposal,
  onAccept,
  onClose,
}: ReorganizeWeekSheetProps) {
  const { t } = useI18n();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Sparkles size={22} color={THEME.colors.calm.lavenderDeep} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>{proposal.headline}</Text>
              <Text style={styles.subtitle}>{proposal.subline}</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel={t('errors.cancel')}
            >
              <X size={22} color={THEME.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            <ReorganizeProposalList moved={proposal.moved} kept={proposal.kept} />
          </ScrollView>

          <View style={styles.footer}>
            <CalmPrimaryButton
              label={t('tasksExperience.reorganizeAccept')}
              onPress={() => {
                onAccept?.();
                onClose();
              }}
              large
            />
            <TouchableOpacity
              onPress={onClose}
              style={styles.secondaryBtn}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryText}>{t('tasksExperience.reorganizeDismiss')}</Text>
            </TouchableOpacity>
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
    maxHeight: '85%',
    backgroundColor: THEME.colors.calm.background,
    borderTopLeftRadius: THEME.borderRadius.rounded,
    borderTopRightRadius: THEME.borderRadius.rounded,
    paddingBottom: THEME.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.md,
    paddingBottom: THEME.spacing.sm,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.calm.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    lineHeight: 26,
  },
  subtitle: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  closeBtn: {
    minWidth: THEME.sizes.touchTarget,
    minHeight: THEME.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: THEME.spacing.md,
    paddingBottom: THEME.spacing.sm,
  },
  footer: {
    paddingHorizontal: THEME.spacing.md,
    gap: THEME.spacing.sm,
    paddingTop: THEME.spacing.xs,
  },
  secondaryBtn: {
    alignItems: 'center',
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
  },
  secondaryText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
  },
});
