import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Keyboard, TouchableOpacity } from 'react-native';
import { Plus } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { CalmCard } from '@/components/ui/calm/CalmCard';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { getLocalDateString } from '@/lib/dateLocal';
import { createVaciarTask } from '@/lib/vaciarCreateTask';
import type { LifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';

export type AreasQuickAddMode = 'inbox' | 'today';

type AreasQuickAddBarProps = {
  hasCheckInToday: boolean;
  mode?: AreasQuickAddMode;
  projectId?: string | null;
  lifeAreaKey?: LifeAreaRef | null;
  /** Abre el modal de planificación en lugar de guardar directo al inbox. */
  onOpenPlan?: (content: string) => void;
  onSaved: (title: string) => void;
  onError?: () => void;
  compact?: boolean;
};

export function AreasQuickAddBar({
  hasCheckInToday,
  mode = 'inbox',
  projectId = null,
  lifeAreaKey = null,
  onOpenPlan,
  onSaved,
  onError,
  compact = false,
}: AreasQuickAddBarProps) {
  const { t, locale } = useI18n();
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const isToday = mode === 'today';
  const today = getLocalDateString();
  const placeholderKey = isToday ? 'hoy.quickAddPlaceholder' : 'areasCompact.quickAddPlaceholder';
  const saveLabelKey = isToday ? 'hoy.quickAddSave' : 'areasCompact.quickAddSave';

  const submitDraft = () => {
    const trimmed = content.trim();
    if (!trimmed || saving) return;

    if (onOpenPlan) {
      onOpenPlan(trimmed);
      setContent('');
      Keyboard.dismiss();
      return;
    }

    void handleSave();
  };

  const handleSave = async () => {
    const trimmed = content.trim();
    if (!trimmed || saving) return;

    setSaving(true);
    try {
      const result = await createVaciarTask(
        {
          content: trimmed,
          hasSubtasks: false,
          subtasks: [],
          assignToProject: Boolean(projectId),
          selectedCategory: 'otros',
          selectedProjectId: projectId,
          selectedDate: isToday ? today : null,
          isPriority: isToday && hasCheckInToday,
          lifeAreaKey: projectId ? null : lifeAreaKey,
        },
        { locale, hasCheckInToday },
      );

      if (result.status === 'not_authenticated' || result.status === 'error') {
        onError?.();
        return;
      }

      setContent('');
      Keyboard.dismiss();
      onSaved(result.savedTitle);
    } finally {
      setSaving(false);
    }
  };

  if (compact) {
    return (
      <View style={styles.compactShell}>
        <TextInput
          style={styles.compactInput}
          value={content}
          onChangeText={setContent}
          placeholder={t(placeholderKey)}
          placeholderTextColor={THEME.colors.text.tertiary}
          maxLength={300}
          autoCorrect={false}
          spellCheck={false}
          accessibilityLabel={t('vaciarExtra.a11yTaskField')}
          returnKeyType="done"
          blurOnSubmit
          onSubmitEditing={submitDraft}
        />
        <TouchableOpacity
          style={[styles.compactSaveBtn, (!content.trim() || saving) && styles.compactSaveBtnDisabled]}
          onPress={submitDraft}
          disabled={!content.trim() || saving}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t(saveLabelKey)}
        >
          <Plus size={20} color={THEME.colors.calm.lavenderDeep} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <CalmCard style={styles.card}>
      <View style={styles.header}>
        <Plus size={18} color={THEME.colors.calm.lavenderDeep} />
        <Text style={styles.title}>
          {t(isToday ? 'hoy.quickAddTitle' : 'areasCompact.quickAddTitle')}
        </Text>
      </View>
      <Text style={styles.hint}>
        {t(isToday ? 'hoy.quickAddHint' : 'areasCompact.quickAddHint')}
      </Text>
      <TextInput
        style={styles.input}
        value={content}
        onChangeText={setContent}
        placeholder={t(placeholderKey)}
        placeholderTextColor={THEME.colors.text.tertiary}
        multiline
        maxLength={300}
        autoCorrect={false}
        spellCheck={false}
        accessibilityLabel={t('vaciarExtra.a11yTaskField')}
        returnKeyType="done"
        blurOnSubmit
        onSubmitEditing={() => void handleSave()}
      />
      <CalmPrimaryButton
        label={saving ? t('vaciar.saving') : t(saveLabelKey)}
        onPress={() => void handleSave()}
        loading={saving}
        disabled={!content.trim() || saving}
      />
    </CalmCard>
  );
}

const styles = StyleSheet.create({
  compactShell: {
    ...THEME.surfaces.panel,
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    padding: THEME.spacing.xs,
  },
  compactSaveBtn: {
    width: THEME.sizes.touchTarget,
    height: THEME.sizes.touchTarget,
    borderRadius: THEME.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.calm.lavender,
    borderWidth: 1,
    borderColor: THEME.colors.calm.lavenderDeep,
  },
  compactSaveBtnDisabled: {
    opacity: 0.45,
  },
  compactInput: {
    ...THEME.typography.body,
    flex: 1,
    color: THEME.colors.text.main,
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.pill,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    minHeight: THEME.sizes.touchTarget,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  card: {
    gap: THEME.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
  },
  title: {
    ...THEME.typography.screenSubtitle,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    flex: 1,
  },
  hint: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  input: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.sm,
    minHeight: 52,
    maxHeight: 96,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    lineHeight: 22,
  },
});
