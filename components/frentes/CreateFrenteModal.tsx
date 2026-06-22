import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useState, useEffect } from 'react';
import { X } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { PROJECT_COLORS } from '@/lib/projectColors';
import { createProjectForUser, createProjectErrorMessage } from '@/lib/createProject';
import type { CreatedProject } from '@/lib/createProject';
import type { AppLocale } from '@/lib/i18n';
import type { LifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';
import { inferLifeAreaKeyForProject } from '@/lib/lifeAreas/lifeAreaCatalog';
import { getLifeAreaAccentColor } from '@/lib/lifeAreas/lifeAreaColors';
import { useUserLifeAreas } from '@/hooks/useUserLifeAreas';
import { ProjectAreaPicker } from '@/components/projects/ProjectAreaPicker';

const EMOJI_OPTIONS = ['🚀', '🎨', '❤️', '💰', '🏋️', '🎓', '💼', '🏠', '✨', '🌿', '📚', '🎬'];

type CreateFrenteModalProps = {
  visible: boolean;
  userId: string;
  locale: AppLocale;
  existingNames?: string[];
  initialLifeAreaKey?: LifeAreaRef;
  onClose: () => void;
  onCreated: (project: CreatedProject) => void;
  onError?: (message: string) => void;
};

export function CreateFrenteModal({
  visible,
  userId,
  locale,
  existingNames = [],
  initialLifeAreaKey,
  onClose,
  onCreated,
  onError,
}: CreateFrenteModalProps) {
  const { t } = useI18n();
  const { config: lifeAreasConfig } = useUserLifeAreas(userId);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('✨');
  const [color, setColor] = useState<string>(PROJECT_COLORS[1]);
  const [lifeAreaKey, setLifeAreaKey] = useState<LifeAreaRef>(initialLifeAreaKey ?? 'other');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName('');
    setEmoji('✨');
    setColor(initialLifeAreaKey ? getLifeAreaAccentColor(initialLifeAreaKey) : PROJECT_COLORS[1]);
    setLifeAreaKey(initialLifeAreaKey ?? 'other');
    setSaving(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  useEffect(() => {
    if (!visible) return;
    if (initialLifeAreaKey) {
      setLifeAreaKey(initialLifeAreaKey);
      setColor(getLifeAreaAccentColor(initialLifeAreaKey));
    }
  }, [initialLifeAreaKey, visible]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    const result = await createProjectForUser({
      userId,
      name: trimmed,
      color,
      lifeAreaKey,
      existingNames,
      locale,
    });
    setSaving(false);
    if (!result.ok) {
      onError?.(createProjectErrorMessage(result.reason, locale));
      return;
    }
    onCreated(result.project);
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboard}
        >
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.title}>{t('frentes.createTitle')}</Text>
                <Text style={styles.sub}>{t('frentes.createSub')}</Text>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn} accessibilityRole="button">
                <X size={22} color={THEME.colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>{t('frentes.createName')}</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (text.trim() && !initialLifeAreaKey) {
                    const inferred = inferLifeAreaKeyForProject(text);
                    setLifeAreaKey(inferred);
                    setColor(getLifeAreaAccentColor(inferred));
                  }
                }}
                placeholder={t('frentes.createNamePlaceholder')}
                placeholderTextColor={THEME.colors.text.tertiary}
                maxLength={48}
              />

              <Text style={styles.label}>{t('projects.areaSectionTitle')}</Text>
              <ProjectAreaPicker
                value={lifeAreaKey}
                onChange={(ref) => {
                  setLifeAreaKey(ref);
                  setColor(getLifeAreaAccentColor(ref));
                }}
                lifeAreasConfig={lifeAreasConfig}
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

              <Text style={styles.label}>{t('frentes.createColor')}</Text>
              <View style={styles.colorRow}>
                {PROJECT_COLORS.map((swatch) => (
                  <TouchableOpacity
                    key={swatch}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: swatch },
                      color === swatch && styles.colorSwatchSelected,
                    ]}
                    onPress={() => setColor(swatch)}
                    accessibilityRole="button"
                  />
                ))}
              </View>

              <CalmPrimaryButton
                label={t('frentes.createSave')}
                onPress={() => void handleSave()}
                disabled={!name.trim() || saving}
                loading={saving}
                large
              />
            </ScrollView>
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
    maxHeight: '88%',
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
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: THEME.spacing.sm,
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  colorSwatchSelected: {
    borderWidth: 3,
    borderColor: THEME.colors.text.main,
  },
});
