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

interface TaskEditModalProps {
  visible: boolean;
  content: string;
  onContentChange: (text: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export function TaskEditModal({
  visible,
  content,
  onContentChange,
  onSave,
  onClose,
}: TaskEditModalProps) {
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
          accessibilityLabel="Cerrar editor de tarea"
          accessibilityHint="Cierra el modal sin guardar cambios"
        />
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Editar tarea</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={onClose}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              accessibilityHint="Cierra el modal sin guardar"
            >
              <X size={24} color={THEME.colors.text.main} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.editInput}
            value={content}
            onChangeText={onContentChange}
            placeholder="Edita tu tarea..."
            placeholderTextColor={THEME.colors.text.secondary}
            multiline
            autoFocus
            accessibilityLabel="Editar contenido de la tarea"
            accessibilityHint="Escribe el nuevo texto de la tarea"
          />

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonCancel]}
              onPress={onClose}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Cancelar edición"
              accessibilityHint="Cierra el modal y descarta cambios"
            >
              <Text style={styles.modalButtonCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSave]}
              onPress={onSave}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Guardar cambios"
              accessibilityHint="Guarda los cambios de esta tarea"
            >
              <Text style={styles.modalButtonSaveText}>Guardar</Text>
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
    backgroundColor: THEME.colors.fill[100],
    borderTopLeftRadius: THEME.borderRadius.rounded,
    borderTopRightRadius: THEME.borderRadius.rounded,
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
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    minHeight: 100,
    marginBottom: THEME.spacing.md,
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
    backgroundColor: THEME.colors.fill[200],
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
    color: THEME.colors.fill[100],
    fontFamily: THEME.fonts.heading.bold,
  },
});
