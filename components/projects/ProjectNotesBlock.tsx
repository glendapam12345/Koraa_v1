import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StickyNote, Pencil } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

type ProjectNotesBlockProps = {
  notes: string | null | undefined;
  onEdit?: () => void;
  compact?: boolean;
};

/** Notas del proyecto — visible en Organizado y detalle. */
export function ProjectNotesBlock({ notes, onEdit, compact = false }: ProjectNotesBlockProps) {
  const { t } = useI18n();
  const trimmed = notes?.trim() ?? '';

  if (!trimmed && !onEdit) return null;

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <View style={styles.header}>
        <StickyNote size={14} color={THEME.colors.calm.lavenderDeep} />
        <Text style={styles.label}>{t('projectsUi.notesLabel')}</Text>
        {onEdit ? (
          <TouchableOpacity
            onPress={onEdit}
            hitSlop={8}
            style={styles.editBtn}
            accessibilityRole="button"
            accessibilityLabel={t('projectsUi.notesEditA11y')}
          >
            <Pencil size={14} color={THEME.colors.calm.lavenderDeep} />
          </TouchableOpacity>
        ) : null}
      </View>
      {trimmed ? (
        <Text style={styles.body}>{trimmed}</Text>
      ) : onEdit ? (
        <TouchableOpacity onPress={onEdit} activeOpacity={0.85} accessibilityRole="button">
          <Text style={styles.placeholder}>{t('projectsUi.notesEmpty')}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.standard,
    backgroundColor: THEME.colors.calm.mist,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  wrapCompact: {
    marginBottom: THEME.spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.secondary,
    flex: 1,
  },
  editBtn: {
    minWidth: 28,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    lineHeight: 22,
  },
  placeholder: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    lineHeight: 18,
  },
});
