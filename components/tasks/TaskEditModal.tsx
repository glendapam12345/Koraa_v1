import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { THEME } from '@/constants/theme';
import { X } from 'lucide-react-native';
import { useI18n } from '@/contexts/I18nContext';
import type { Task } from '@/components/tasks/TaskCard';
import { TaskPlanEditSheet } from '@/components/vnext/TaskPlanEditSheet';
import type { TaskPlanEditPayload } from '@/lib/vnext/saveTaskPlanEdit';

interface TaskEditModalProps {
  visible: boolean;
  content?: string;
  task?: Task | null;
  projects?: { id: string; name: string }[];
  userId?: string;
  onProjectCreated?: (project: { id: string; name: string }) => void;
  onContentChange?: (text: string) => void;
  onSave?: () => void;
  onSavePlan?: (payload: TaskPlanEditPayload) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  saving?: boolean;
  onClose: () => void;
}

export function TaskEditModal({
  visible,
  content = '',
  task = null,
  projects = [],
  userId,
  onProjectCreated,
  onContentChange,
  onSave,
  onSavePlan,
  onDelete,
  saving = false,
  onClose,
}: TaskEditModalProps) {
  const { t } = useI18n();

  if (task && onSavePlan) {
    return (
      <TaskPlanEditSheet
        visible={visible}
        task={task}
        projects={projects}
        userId={userId}
        onProjectCreated={onProjectCreated}
        onSave={onSavePlan}
        onDelete={onDelete}
        onClose={onClose}
        saving={saving}
      />
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('components.editTaskModalCloseA11y')}
          accessibilityHint={t('components.editTaskModalCloseHint')}
        />
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('components.editTask')}</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={onClose}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('components.editTaskModalCloseShortA11y')}
              accessibilityHint={t('components.editTaskModalCloseShortHint')}
            >
              <X size={24} color={THEME.colors.text.main} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.editInput}
            value={content}
            onChangeText={onContentChange ?? (() => {})}
            placeholder={t('components.editTaskPlaceholder')}
            placeholderTextColor={THEME.colors.text.secondary}
            multiline
            autoFocus
            autoCorrect={false}
            spellCheck={false}
            accessibilityLabel={t('components.editTaskContentA11y')}
            accessibilityHint={t('components.editTaskContentHint')}
          />

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonCancel]}
              onPress={onClose}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('components.cancelEditA11y')}
              accessibilityHint={t('components.cancelEditHint')}
            >
              <Text style={styles.modalButtonCancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSave]}
              onPress={onSave ?? onClose}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('components.saveChangesA11y')}
              accessibilityHint={t('components.saveChangesHint')}
            >
              <Text style={styles.modalButtonSaveText}>{t('common.save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: THEME.colors.overlay,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: THEME.colors.calm.card,
    borderTopLeftRadius: THEME.borderRadius.rounded,
    borderTopRightRadius: THEME.borderRadius.rounded,
    borderTopWidth: 1,
    borderColor: THEME.colors.calm.border,
    padding: THEME.spacing.lg,
    paddingBottom: THEME.spacing.xl * 2,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.lg,
  },
  modalTitle: {
    ...THEME.typography.h2,
    color: THEME.colors.text.main,
  },
  modalCloseButton: {
    padding: THEME.spacing.xs,
  },
  editInput: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    backgroundColor: THEME.colors.calm.card,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    minHeight: 100,
    marginBottom: THEME.spacing.md,
    ...(Platform.OS === 'android' ? { fontFamily: THEME.fonts.heading.medium } : {}),
  },
  modalActions: {
    flexDirection: 'row',
    gap: THEME.spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: THEME.colors.calm.mist,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  modalButtonSave: {
    backgroundColor: THEME.colors.gradient.blue,
  },
  modalButtonCancelText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
  },
  modalButtonSaveText: {
    ...THEME.typography.body,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
  },
});
