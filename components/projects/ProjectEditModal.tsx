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
import { X } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { PROJECT_COLORS } from '@/lib/projectColors';
import { useI18n } from '@/contexts/I18nContext';

type ProjectEditModalProps = {
  visible: boolean;
  name: string;
  color: string;
  dueDate?: string;
  onNameChange: (value: string) => void;
  onColorChange: (value: string) => void;
  onDueDateChange?: (value: string) => void;
  onSave: () => void;
  onClose: () => void;
  onDelete?: () => void;
  saving?: boolean;
};

export function ProjectEditModal({
  visible,
  name,
  color,
  dueDate = '',
  onNameChange,
  onColorChange,
  onDueDateChange,
  onSave,
  onClose,
  onDelete,
  saving = false,
}: ProjectEditModalProps) {
  const { t } = useI18n();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('projects.editProjectTitle')}</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel={t('common.cancel')}>
              <X size={24} color={THEME.colors.text.main} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>{t('projectSelectorExtra.nameLabel')}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={onNameChange}
            placeholder={t('projectSelectorExtra.namePlaceholder')}
            placeholderTextColor={THEME.colors.text.tertiary}
            maxLength={80}
            returnKeyType="done"
            onSubmitEditing={onSave}
            accessibilityLabel={t('projects.editProjectNameA11y')}
          />

          <Text style={styles.label}>{t('projectSelectorExtra.colorLabel')}</Text>
          <View style={styles.colorRow}>
            {PROJECT_COLORS.map((c, i) => (
              <TouchableOpacity
                key={`edit-color-${i}`}
                style={[
                  styles.colorOption,
                  { backgroundColor: c },
                  color === c && styles.colorOptionSelected,
                ]}
                onPress={() => onColorChange(c)}
                accessibilityRole="button"
                accessibilityState={{ selected: color === c }}
              />
            ))}
          </View>

          {onDueDateChange ? (
            <>
              <Text style={styles.label}>{t('projects.dueDateLabel')}</Text>
              <TextInput
                style={styles.input}
                value={dueDate}
                onChangeText={onDueDateChange}
                placeholder={t('projects.dueDatePlaceholder')}
                placeholderTextColor={THEME.colors.text.tertiary}
                keyboardType="numbers-and-punctuation"
                maxLength={10}
                accessibilityLabel={t('projects.dueDateA11y')}
              />
              <Text style={styles.hint}>{t('projects.dueDateHint')}</Text>
            </>
          ) : null}

          {onDelete ? (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={onDelete}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t('projects.deleteProjectA11y', { name: name.trim() || '…' })}
            >
              <Text style={styles.deleteText}>{t('projects.deleteProject')}</Text>
            </TouchableOpacity>
          ) : null}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.85}>
              <Text style={styles.cancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, (!name.trim() || saving) && styles.saveBtnDisabled]}
              onPress={onSave}
              disabled={!name.trim() || saving}
              activeOpacity={0.85}
            >
              <Text style={styles.saveText}>
                {saving ? t('vaciar.saving') : t('common.save')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: THEME.colors.overlay,
  },
  backdrop: {
    flex: 1,
  },
  content: {
    backgroundColor: THEME.colors.fill[100],
    borderTopLeftRadius: THEME.borderRadius.rounded,
    borderTopRightRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.lg,
    paddingBottom: THEME.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.md,
  },
  title: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
  },
  label: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.xs,
    marginTop: THEME.spacing.sm,
  },
  input: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.standard,
    padding: THEME.spacing.md,
    minHeight: THEME.sizes.touchTarget,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.sm,
    marginTop: THEME.spacing.xs,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: THEME.colors.text.main,
  },
  hint: {
    ...THEME.typography.caption,
    color: THEME.colors.text.tertiary,
    marginTop: 4,
  },
  deleteBtn: {
    marginTop: THEME.spacing.lg,
    minHeight: THEME.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.semantic.dangerSoft,
    borderWidth: 1,
    borderColor: THEME.colors.semantic.dangerBorder,
  },
  deleteText: {
    ...THEME.typography.body,
    color: THEME.colors.semantic.danger,
    fontFamily: THEME.fonts.heading.bold,
  },
  actions: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
    marginTop: THEME.spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    minHeight: THEME.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.fill[200],
  },
  cancelText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
  },
  saveBtn: {
    flex: 1,
    minHeight: THEME.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.gradient.blue,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveText: {
    ...THEME.typography.body,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
  },
});
