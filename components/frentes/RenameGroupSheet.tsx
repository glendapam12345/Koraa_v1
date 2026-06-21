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

const EMOJI_OPTIONS = ['✨', '🚀', '🎨', '❤️', '💼', '🏠', '🌿', '📚', '🎬', '💡', '🎯', '🧘'];

type RenameGroupSheetProps = {
  visible: boolean;
  initialName: string;
  initialEmoji: string;
  onClose: () => void;
  onSave: (payload: { name: string; emoji: string }) => void;
};

export function RenameGroupSheet({
  visible,
  initialName,
  initialEmoji,
  onClose,
  onSave,
}: RenameGroupSheetProps) {
  const { t } = useI18n();
  const [name, setName] = useState(initialName);
  const [emoji, setEmoji] = useState(initialEmoji);

  useEffect(() => {
    if (visible) {
      setName(initialName);
      setEmoji(initialEmoji);
    }
  }, [initialEmoji, initialName, visible]);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave({ name: trimmed, emoji });
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
                <Text style={styles.title}>{t('frentes.renameGroupTitle')}</Text>
                <Text style={styles.sub}>{t('frentes.renameGroupSub')}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityRole="button">
                <X size={22} color={THEME.colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.body}>
              <Text style={styles.label}>{t('frentes.createName')}</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder={t('frentes.createGroupPlaceholder')}
                placeholderTextColor={THEME.colors.text.tertiary}
                maxLength={48}
              />

              <Text style={styles.label}>{t('frentes.createEmoji')}</Text>
              <View style={styles.emojiRow}>
                {EMOJI_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.emojiBtn, emoji === option && styles.emojiBtnSelected]}
                    onPress={() => setEmoji(option)}
                    accessibilityRole="button"
                  >
                    <Text style={styles.emojiText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <CalmPrimaryButton
                label={t('frentes.renameGroupSave')}
                onPress={handleSave}
                disabled={!name.trim()}
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
  label: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.secondary,
    marginTop: 4,
  },
  input: {
    ...THEME.typography.body,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: THEME.colors.text.main,
    backgroundColor: THEME.colors.calm.mist,
  },
  emojiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: THEME.spacing.sm,
  },
  emojiBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.calm.mist,
  },
  emojiBtnSelected: {
    backgroundColor: THEME.colors.calm.lavender,
    borderWidth: 2,
    borderColor: THEME.colors.calm.lavenderDeep,
  },
  emojiText: {
    fontSize: THEME.typography.displayEmojiMd.fontSize,
    lineHeight: 26,
  },
});
