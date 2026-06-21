import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { X } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { VnextSelectableChip } from '@/components/vnext/VnextSelectableChip';
import {
  type DayReflectionOutcome,
} from '@/lib/vnext/dayReflection';

export type { DayReflectionOutcome } from '@/lib/vnext/dayReflection';
export { reflectionToReorganizeReason } from '@/lib/vnext/dayReflection';

const OUTCOMES: DayReflectionOutcome[] = [
  'difficult_day',
  'less_energy',
  'unexpected',
  'finished_all',
  'finished_early',
];

const OUTCOME_EMOJI: Record<DayReflectionOutcome, string> = {
  finished_all: '😊',
  less_energy: '😴',
  difficult_day: '😔',
  unexpected: '🚨',
  finished_early: '⚡',
};

type DayReflectionSheetProps = {
  visible: boolean;
  selected?: DayReflectionOutcome | null;
  onSelect: (outcome: DayReflectionOutcome) => void;
  onReplan: () => void;
  onClose: () => void;
  isReplanning?: boolean;
};

export function DayReflectionSheet({
  visible,
  selected,
  onSelect,
  onReplan,
  onClose,
  isReplanning = false,
}: DayReflectionSheetProps) {
  const { t } = useI18n();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('vnext.reflectionTitle')}</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel={t('errors.cancel')}
            >
              <X size={22} color={THEME.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.sub}>{t('vnext.reflectionSub')}</Text>

          <ScrollView contentContainerStyle={styles.options} keyboardShouldPersistTaps="handled">
            {OUTCOMES.map((outcome) => (
              <VnextSelectableChip
                key={outcome}
                label={t(`vnext.reflection.${outcome}`)}
                emoji={OUTCOME_EMOJI[outcome]}
                selected={selected === outcome}
                onPress={() => onSelect(outcome)}
              />
            ))}
          </ScrollView>

          <CalmPrimaryButton
            label={t('vnext.reflectionReplan')}
            onPress={onReplan}
            large
            disabled={!selected}
            loading={isReplanning}
          />
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
    padding: THEME.spacing.md,
    paddingBottom: THEME.spacing.lg,
    gap: THEME.spacing.sm,
    maxHeight: '88%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    flex: 1,
  },
  sub: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
  },
  closeBtn: {
    width: THEME.sizes.touchTarget,
    height: THEME.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  options: {
    gap: 10,
    paddingVertical: THEME.spacing.xs,
  },
});
