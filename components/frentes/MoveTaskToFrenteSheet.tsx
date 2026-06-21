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
import type { FrenteMoveTarget } from '@/lib/frentes/captureItemFront';

type MoveTaskToFrenteSheetProps = {
  visible: boolean;
  taskTitle: string;
  targets: FrenteMoveTarget[];
  onSelect: (frontKey: string) => void;
  onClose: () => void;
};

export function MoveTaskToFrenteSheet({
  visible,
  taskTitle,
  targets,
  onSelect,
  onClose,
}: MoveTaskToFrenteSheetProps) {
  const { t } = useI18n();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>{t('frentes.moveToFrenteTitle')}</Text>
              <Text style={styles.subtitle} numberOfLines={2}>
                {taskTitle}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityRole="button">
              <X size={22} color={THEME.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.hint}>{t('frentes.moveToFrenteHint')}</Text>

          <ScrollView contentContainerStyle={styles.list}>
            {targets.map((target) => (
              <TouchableOpacity
                key={target.key}
                style={styles.option}
                onPress={() => {
                  onSelect(target.key);
                  onClose();
                }}
                activeOpacity={0.85}
                accessibilityRole="button"
              >
                <Text style={styles.optionEmoji}>{target.emoji}</Text>
                <View style={styles.optionText}>
                  <Text style={styles.optionLabel}>{target.label}</Text>
                  {target.subtitle ? (
                    <Text style={styles.optionMeta}>{target.subtitle}</Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
    maxHeight: '70%',
    backgroundColor: THEME.colors.calm.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: THEME.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
    padding: THEME.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THEME.colors.calm.border,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...THEME.typography.h3,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
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
  hint: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.sm,
    lineHeight: 18,
  },
  list: {
    padding: THEME.spacing.md,
    gap: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: THEME.colors.calm.mist,
  },
  optionEmoji: {
    fontSize: THEME.typography.displayEmojiMd.fontSize,
    lineHeight: 26,
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
  },
  optionMeta: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
  },
});
