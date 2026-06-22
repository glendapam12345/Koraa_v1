import type { ReactNode } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Check, FolderKanban } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { PROJECT_COLORS } from '@/lib/projectColors';
import { useI18n } from '@/contexts/I18nContext';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { ProjectDueDatePicker } from '@/components/projects/ProjectDueDatePicker';
import { ProjectAreaPicker } from '@/components/projects/ProjectAreaPicker';
import type { LifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';
import type { UserLifeAreasConfig } from '@/lib/lifeAreas/userLifeAreas';
import { formatProjectDueDate } from '@/lib/projectProgress';

const UI_ACCENT = THEME.colors.calm.lavenderDeep;

type ProjectCreateFormProps = {
  name: string;
  color: string;
  dueDate: string;
  lifeAreaKey: LifeAreaRef;
  lifeAreasConfig?: UserLifeAreasConfig;
  onAddCustomArea?: () => void;
  error?: string | null;
  saving?: boolean;
  embedded?: boolean;
  hideFooter?: boolean;
  onNameChange: (value: string) => void;
  onColorChange: (value: string) => void;
  onDueDateChange: (value: string) => void;
  onLifeAreaChange: (value: LifeAreaRef) => void;
  onCancel: () => void;
  onSubmit: () => void;
};

type FieldSectionProps = {
  title: string;
  badge?: string;
  badgeTone?: 'required' | 'optional';
  hint?: string;
  children: ReactNode;
};

function FieldSection({ title, badge, badgeTone, hint, children }: FieldSectionProps) {
  return (
    <View style={fieldStyles.section}>
      <View style={fieldStyles.header}>
        <View style={fieldStyles.titleRow}>
          <Text style={fieldStyles.title}>{title}</Text>
          {badge ? (
            <View
              style={[
                fieldStyles.badge,
                badgeTone === 'required' ? fieldStyles.badgeRequired : fieldStyles.badgeOptional,
              ]}
            >
              <Text
                style={[
                  fieldStyles.badgeText,
                  badgeTone === 'required'
                    ? fieldStyles.badgeTextRequired
                    : fieldStyles.badgeTextOptional,
                ]}
              >
                {badge}
              </Text>
            </View>
          ) : null}
        </View>
        {hint ? <Text style={fieldStyles.hint}>{hint}</Text> : null}
      </View>
      <View style={fieldStyles.body}>{children}</View>
    </View>
  );
}

/** Campos compartidos para crear un proyecto (nombre, color, fecha límite). */
export function ProjectCreateForm({
  name,
  color,
  dueDate,
  lifeAreaKey,
  lifeAreasConfig,
  onAddCustomArea,
  error = null,
  saving = false,
  embedded = false,
  hideFooter = false,
  onNameChange,
  onColorChange,
  onDueDateChange,
  onLifeAreaChange,
  onCancel,
  onSubmit,
}: ProjectCreateFormProps) {
  const { t, locale } = useI18n();
  const dueLabel = dueDate.trim() ? formatProjectDueDate(dueDate, locale) : null;

  if (embedded) {
    return (
      <View style={styles.wrapEmbedded}>
        <FieldSection
          title={t('projectSelectorExtra.nameLabel')}
          badge={t('projects.createFieldRequired')}
          badgeTone="required"
        >
          <TextInput
            style={fieldStyles.input}
            value={name}
            onChangeText={onNameChange}
            placeholder={t('projectSelectorExtra.namePlaceholder')}
            placeholderTextColor={THEME.colors.text.tertiary}
            maxLength={80}
            returnKeyType="done"
            accessibilityLabel={t('projects.editProjectNameA11y')}
          />
        </FieldSection>

        <FieldSection
          title={t('projects.dueDateSectionTitle')}
          badge={t('projects.dueDateOptionalBadge')}
          badgeTone="optional"
          hint={t('projects.dueDateSectionSubCreate')}
        >
          <ProjectDueDatePicker
            dueDate={dueDate}
            onDueDateChange={onDueDateChange}
            accentColor={UI_ACCENT}
            layout="create"
            surface="flat"
            showHint={false}
          />
        </FieldSection>

        <FieldSection
          title={t('projects.areaSectionTitle')}
          badge={t('projects.dueDateOptionalBadge')}
          badgeTone="optional"
          hint={t('projects.areaSectionSubCreate')}
        >
          <ProjectAreaPicker
            value={lifeAreaKey}
            onChange={onLifeAreaChange}
            lifeAreasConfig={lifeAreasConfig}
            onAddCustomArea={onAddCustomArea}
          />
        </FieldSection>

        <FieldSection title={t('projectSelectorExtra.colorLabel')}>
          <View style={fieldStyles.colorRow}>
            {PROJECT_COLORS.map((c, i) => {
              const selected = color === c;
              return (
                <TouchableOpacity
                  key={`create-color-${i}`}
                  style={[
                    fieldStyles.colorOptionWrap,
                    selected && fieldStyles.colorOptionWrapSelected,
                  ]}
                  onPress={() => onColorChange(c)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <View style={[fieldStyles.colorOption, { backgroundColor: c }]}>
                    {selected ? (
                      <Check size={18} color={THEME.colors.onGradient} strokeWidth={3} />
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </FieldSection>

        {name.trim() ? (
          <View style={styles.previewCard}>
            <View style={[styles.previewBar, { backgroundColor: color }]} />
            <View style={styles.previewBody}>
              <FolderKanban size={18} color={color} />
              <View style={styles.previewTextWrap}>
                <Text style={styles.previewName} numberOfLines={1}>
                  {name.trim()}
                </Text>
                <Text style={styles.previewMeta} numberOfLines={1}>
                  {dueLabel
                    ? t('projectsUi.dueDate', { date: dueLabel })
                    : t('projects.dueDateNoneChip')}
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {error && !hideFooter ? <Text style={styles.error}>{error}</Text> : null}

        {!hideFooter ? (
          <View style={styles.actionsEmbedded}>
            <CalmPrimaryButton
              label={saving ? t('components.creatingProject') : t('components.createProject')}
              onPress={onSubmit}
              loading={saving}
              disabled={!name.trim() || saving}
              large
              style={styles.saveBtnFull}
            />
          </View>
        ) : null}
      </View>
    );
  }

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

      <ProjectDueDatePicker
        dueDate={dueDate}
        onDueDateChange={onDueDateChange}
        accentColor={UI_ACCENT}
        layout="compact"
        showHint
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

const fieldStyles = StyleSheet.create({
  section: {
    ...THEME.surfaces.elevated,
    padding: THEME.spacing.sm,
    gap: THEME.spacing.xs,
    borderColor: THEME.colors.calm.border,
  },
  header: {
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: THEME.spacing.xs,
  },
  title: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  badge: {
    paddingHorizontal: THEME.spacing.xs,
    paddingVertical: 2,
    borderRadius: THEME.borderRadius.pill,
    borderWidth: 1,
  },
  badgeRequired: {
    backgroundColor: THEME.colors.calm.lavender,
    borderColor: THEME.colors.calm.border,
  },
  badgeOptional: {
    backgroundColor: THEME.colors.calm.card,
    borderColor: THEME.colors.calm.border,
  },
  badgeText: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.medium,
  },
  badgeTextRequired: {
    color: UI_ACCENT,
  },
  badgeTextOptional: {
    color: THEME.colors.text.secondary,
  },
  hint: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  body: {
    gap: THEME.spacing.xs,
  },
  input: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    backgroundColor: THEME.colors.calm.mist,
    borderRadius: THEME.borderRadius.standard,
    padding: THEME.spacing.sm,
    minHeight: THEME.sizes.touchTarget,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.sm,
  },
  colorOptionWrap: {
    padding: 3,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionWrapSelected: {
    borderColor: UI_ACCENT,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.xs,
  },
  wrapEmbedded: {
    gap: THEME.spacing.xs,
  },
  title: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    marginBottom: 2,
  },
  hint: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
    marginBottom: THEME.spacing.sm,
  },
  previewCard: {
    flexDirection: 'row',
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.calm.mist,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    overflow: 'hidden',
  },
  previewBar: {
    width: 5,
  },
  previewBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    padding: THEME.spacing.sm,
  },
  previewTextWrap: {
    flex: 1,
    gap: 2,
  },
  previewName: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  previewMeta: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
  },
  label: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    marginTop: THEME.spacing.xs,
  },
  input: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    backgroundColor: THEME.colors.calm.card,
    borderRadius: THEME.borderRadius.standard,
    padding: THEME.spacing.sm,
    minHeight: THEME.sizes.touchTarget,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.sm,
    marginTop: THEME.spacing.xs,
    marginBottom: THEME.spacing.xs,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: THEME.colors.text.main,
    transform: [{ scale: 1.08 }],
  },
  error: {
    ...THEME.typography.small,
    color: THEME.colors.semantic.danger,
    marginTop: THEME.spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    marginTop: THEME.spacing.md,
  },
  actionsEmbedded: {
    marginTop: THEME.spacing.xs,
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
  saveBtnFull: {
    width: '100%',
  },
});
