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
import { LifeAreaSwatchGrid } from '@/components/tasks/experience/LifeAreaSwatchGrid';
import type { LifeArea } from '@/lib/lifeAreas/types';

type LifeAreaPickerSheetProps = {
  visible: boolean;
  areas: LifeArea[];
  selectedId?: string | null;
  onSelect: (areaId: string) => void;
  onClose: () => void;
};

/** Selector visual de área — prototipo, sin persistencia. */
export function LifeAreaPickerSheet({
  visible,
  areas,
  selectedId,
  onSelect,
  onClose,
}: LifeAreaPickerSheetProps) {
  const { t } = useI18n();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>{t('tasksExperience.areaPickerTitle')}</Text>
              <Text style={styles.subtitle}>{t('tasksExperience.areaPickerSub')}</Text>
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

          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <LifeAreaSwatchGrid
              areas={areas}
              selectedId={selectedId}
              onSelect={(id) => {
                onSelect(id);
                onClose();
              }}
              onCreatePress={() => {
                onClose();
              }}
            />

            <View style={styles.hintCard}>
              <Sparkles size={16} color={THEME.colors.calm.lavenderDeep} />
              <Text style={styles.hintText}>{t('tasksExperience.areaPickerHint')}</Text>
            </View>
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
    maxHeight: '78%',
    backgroundColor: THEME.colors.calm.card,
    borderTopLeftRadius: THEME.borderRadius.rounded,
    borderTopRightRadius: THEME.borderRadius.rounded,
    borderTopWidth: 1,
    borderColor: THEME.colors.calm.border,
    paddingBottom: THEME.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.md,
    paddingBottom: THEME.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THEME.colors.calm.border,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
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
    padding: THEME.spacing.md,
    gap: THEME.spacing.md,
  },
  hintCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.standard,
    backgroundColor: THEME.colors.calm.lavender,
  },
  hintText: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    flex: 1,
    lineHeight: 18,
  },
});
