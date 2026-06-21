import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';

type AddStepToGroupSheetProps = {
  visible: boolean;
  groupName: string;
  onClose: () => void;
  onAdd: (content: string) => void;
};

export function AddStepToGroupSheet({
  visible,
  groupName,
  onClose,
  onAdd,
}: AddStepToGroupSheetProps) {
  const { t } = useI18n();
  const [content, setContent] = useState('');

  useEffect(() => {
    if (visible) setContent('');
  }, [visible]);

  const handleAdd = () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setContent('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboard}
        >
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.title}>{t('frentes.addStepTitle')}</Text>
                <Text style={styles.sub}>{t('frentes.addStepSub', { group: groupName })}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityRole="button">
                <X size={22} color={THEME.colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.body}>
              <TextInput
                style={styles.input}
                value={content}
                onChangeText={setContent}
                placeholder={t('frentes.addStepPlaceholder')}
                placeholderTextColor={THEME.colors.text.tertiary}
                multiline
                maxLength={500}
                autoFocus
                textAlignVertical="top"
              />

              <CalmPrimaryButton
                label={t('frentes.addStepSave')}
                onPress={handleAdd}
                disabled={!content.trim()}
                large
              />
            </View>
          </Pressable>
        </KeyboardAvoidingView>
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
  keyboard: {
    justifyContent: 'flex-end',
  },
  sheet: {
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
  sub: {
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
    gap: THEME.spacing.sm,
  },
  input: {
    ...THEME.typography.body,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 96,
    color: THEME.colors.text.main,
    backgroundColor: THEME.colors.calm.mist,
  },
});
