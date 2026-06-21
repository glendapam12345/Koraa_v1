import { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import type { EmergencyKitEventId, EmergencyKitModuleId, NewComfortItem } from '@/lib/emergencyKit/types';

type EmergencyKitAddItemModalProps = {
  visible: boolean;
  moduleId: EmergencyKitModuleId;
  eventId: EmergencyKitEventId;
  onClose: () => void;
  onSave: (item: NewComfortItem) => void;
};

export function EmergencyKitAddItemModal({
  visible,
  moduleId,
  eventId,
  onClose,
  onSave,
}: EmergencyKitAddItemModalProps) {
  const { t } = useI18n();
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [phone, setPhone] = useState('');
  const [letterContent, setLetterContent] = useState('');

  const reset = () => {
    setTitle('');
    setSubtitle('');
    setUrl('');
    setNote('');
    setPhone('');
    setLetterContent('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = () => {
    const tags = [eventId];
    switch (moduleId) {
      case 'music':
        if (!title.trim()) return;
        onSave({
          type: 'music',
          title: title.trim(),
          artist: subtitle.trim() || undefined,
          spotifyUrl: url.trim() || undefined,
          tags,
        });
        break;
      case 'movies':
        if (!title.trim()) return;
        onSave({
          type: 'movies',
          title: title.trim(),
          description: note.trim() || undefined,
          platform: subtitle.trim() || undefined,
          watchUrl: url.trim() || undefined,
          tags,
        });
        break;
      case 'shows':
        if (!title.trim()) return;
        onSave({
          type: 'shows',
          title: title.trim(),
          platform: subtitle.trim() || undefined,
          seasons: note.trim() || undefined,
          watchUrl: url.trim() || undefined,
          tags,
        });
        break;
      case 'books':
        if (!title.trim()) return;
        onSave({
          type: 'books',
          title: title.trim(),
          author: subtitle.trim() || undefined,
          tags,
        });
        break;
      case 'internet':
        if (!title.trim()) return;
        onSave({
          type: 'internet',
          title: title.trim(),
          kind: 'other',
          url: url.trim() || undefined,
          tags,
        });
        break;
      case 'places':
        if (!title.trim()) return;
        onSave({
          type: 'places',
          title: title.trim(),
          notes: note.trim() || undefined,
          mapUrl: url.trim() || undefined,
          tags,
        });
        break;
      case 'support_circle':
        if (!title.trim()) return;
        onSave({
          type: 'support_circle',
          name: title.trim(),
          relationship: subtitle.trim() || undefined,
          phone: phone.trim() || undefined,
          tags,
        });
        break;
      case 'letters':
        if (!letterContent.trim()) return;
        onSave({
          type: 'letters',
          content: letterContent.trim(),
          eventTags: [eventId],
          tags,
        });
        break;
      case 'memory_box':
        if (!title.trim()) return;
        onSave({
          type: 'memory_box',
          title: title.trim(),
          note: note.trim() || undefined,
          mediaUrl: url.trim() || undefined,
          kind: 'note',
          tags,
        });
        break;
      default:
        return;
    }
    reset();
    onClose();
  };

  const moduleTitle = t(`emergencyKit.modules.${moduleId}.title`);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t('emergencyKit.addItemTitle', { module: moduleTitle })}</Text>
            <TouchableOpacity onPress={handleClose} accessibilityLabel={t('common.cancel')}>
              <X size={24} color={THEME.colors.text.secondary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
            {moduleId === 'letters' ? (
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={t('emergencyKit.addLetterPlaceholder')}
                placeholderTextColor={THEME.colors.text.tertiary}
                value={letterContent}
                onChangeText={setLetterContent}
                multiline
                textAlignVertical="top"
              />
            ) : (
              <>
                <TextInput
                  style={styles.input}
                  placeholder={t(`emergencyKit.addFields.${moduleId}.title`)}
                  placeholderTextColor={THEME.colors.text.tertiary}
                  value={title}
                  onChangeText={setTitle}
                />
                {moduleId !== 'places' && moduleId !== 'memory_box' ? (
                  <TextInput
                    style={styles.input}
                    placeholder={t(`emergencyKit.addFields.${moduleId}.subtitle`)}
                    placeholderTextColor={THEME.colors.text.tertiary}
                    value={subtitle}
                    onChangeText={setSubtitle}
                  />
                ) : null}
                {(moduleId === 'places' || moduleId === 'movies' || moduleId === 'memory_box') && (
                  <TextInput
                    style={[styles.input, moduleId === 'memory_box' ? styles.textArea : undefined]}
                    placeholder={t(`emergencyKit.addFields.${moduleId}.note`)}
                    placeholderTextColor={THEME.colors.text.tertiary}
                    value={note}
                    onChangeText={setNote}
                    multiline={moduleId === 'memory_box'}
                  />
                )}
                {moduleId === 'support_circle' ? (
                  <TextInput
                    style={styles.input}
                    placeholder={t('emergencyKit.addFields.support_circle.phone')}
                    placeholderTextColor={THEME.colors.text.tertiary}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                ) : null}
                {moduleId !== 'books' && moduleId !== 'support_circle' ? (
                  <TextInput
                    style={styles.input}
                    placeholder={t(`emergencyKit.addFields.${moduleId}.url`)}
                    placeholderTextColor={THEME.colors.text.tertiary}
                    value={url}
                    onChangeText={setUrl}
                    autoCapitalize="none"
                    keyboardType="url"
                  />
                ) : null}
              </>
            )}
          </ScrollView>
          <CalmPrimaryButton label={t('common.save')} onPress={handleSave} large />
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
  sheet: {
    backgroundColor: THEME.colors.calm.card,
    borderTopLeftRadius: THEME.borderRadius.card,
    borderTopRightRadius: THEME.borderRadius.card,
    padding: THEME.spacing.md,
    gap: THEME.spacing.sm,
    maxHeight: '88%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    ...THEME.typography.h3,
    flex: 1,
    paddingRight: THEME.spacing.sm,
  },
  form: {
    gap: THEME.spacing.sm,
    paddingBottom: THEME.spacing.sm,
  },
  input: {
    ...THEME.typography.body,
    lineHeight: 24,
    backgroundColor: THEME.surfaces.muted.backgroundColor,
    borderRadius: THEME.borderRadius.standard,
    padding: THEME.spacing.sm,
    color: THEME.colors.text.main,
    minHeight: THEME.sizes.touchTarget,
    ...(Platform.OS === 'android' ? { fontFamily: THEME.fonts.heading.medium } : {}),
  },
  textArea: {
    minHeight: 120,
  },
});
