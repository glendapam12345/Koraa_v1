import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { THEME } from '@/constants/theme';
import { PROJECT_COLORS } from '@/lib/projectColors';
import { useI18n } from '@/contexts/I18nContext';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';

type ProjectCreateFormProps = {
  name: string;
  color: string;
  dueDate: string;
  error?: string | null;
  saving?: boolean;
  onNameChange: (value: string) => void;
  onColorChange: (value: string) => void;
  onDueDateChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
};

/** Campos compartidos para crear un proyecto (nombre, color, fecha límite). */
export function ProjectCreateForm({
  name,
  color,
  dueDate,
  error = null,
  saving = false,
  onNameChange,
  onColorChange,
  onDueDateChange,
  onCancel,
  onSubmit,
}: ProjectCreateFormProps) {
  const { t } = useI18n();

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{t('projectSelectorExtra.newTitle')}</Text>
      <Text style={styles.hint}>{t('projects.createProjectFormHint')}</Text>

      <Text style={styles.label}>{t('projectSelectorExtra.nameLabel')}</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={onNameChange}
        placeholder={t('projectSelectorExtra.namePlaceholder')}
        placeholderTextColor={THEME.colors.text.tertiary}
        maxLength={80}
        returnKeyType="next"
        accessibilityLabel={t('projects.editProjectNameA11y')}
      />

      <Text style={styles.label}>{t('projectSelectorExtra.colorLabel')}</Text>
      <View style={styles.colorRow}>
        {PROJECT_COLORS.map((c, i) => (
          <TouchableOpacity
            key={`create-color-${i}`}
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
      <Text style={styles.fieldHint}>{t('projects.dueDateHint')}</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={onCancel}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <Text style={styles.cancelText}>{t('common.cancel')}</Text>
        </TouchableOpacity>
        <CalmPrimaryButton
          label={saving ? t('components.creatingProject') : t('components.createProject')}
          onPress={onSubmit}
          loading={saving}
          disabled={!name.trim() || saving}
          style={styles.saveBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.xs,
  },
  title: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    marginBottom: 2,
  },
  hint: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
    marginBottom: THEME.spacing.xs,
  },
  label: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    marginTop: THEME.spacing.xs,
  },
  fieldHint: {
    ...THEME.typography.caption,
    color: THEME.colors.text.tertiary,
    lineHeight: 16,
  },
  input: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.standard,
    padding: THEME.spacing.sm,
    minHeight: THEME.sizes.touchTarget,
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.sm,
    marginTop: THEME.spacing.xs,
    marginBottom: THEME.spacing.xs,
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
  error: {
    ...THEME.typography.small,
    color: THEME.colors.semantic.danger,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    marginTop: THEME.spacing.sm,
  },
  cancelBtn: {
    minHeight: THEME.sizes.touchTarget,
    paddingHorizontal: THEME.spacing.sm,
    justifyContent: 'center',
  },
  cancelText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
  },
  saveBtn: {
    flex: 1,
  },
});
