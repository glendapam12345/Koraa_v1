import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { X, Sparkles } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import type { TaskCaptureResult } from '@/lib/taskCaptureTypes';

type TaskCaptureAiPreviewProps = {
  visible: boolean;
  capture: TaskCaptureResult | null;
  isSaving: boolean;
  onConfirm: () => void;
  onApplyToForm: () => void;
  onClose: () => void;
  formatDate: (iso: string | null) => string;
};

export function TaskCaptureAiPreview({
  visible,
  capture,
  isSaving,
  onConfirm,
  onApplyToForm,
  onClose,
  formatDate,
}: TaskCaptureAiPreviewProps) {
  const { t } = useI18n();
  if (!capture) return null;

  const effortLabel = (effort: typeof capture.main_task.effort) => {
    if (effort === 'light') return t('vaciar.effortLight');
    if (effort === 'heavy') return t('vaciar.effortHeavy');
    if (effort === 'medium') return t('vaciar.effortMedium');
    return '';
  };

  const allTasks = [capture.main_task, ...capture.prep_steps];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Sparkles size={20} color={THEME.colors.calm.lavenderDeep} />
              <Text style={styles.title}>{t('vaciar.aiPreviewTitle')}</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={t('vaciar.aiPreviewCloseA11y')}
            >
              <X size={22} color={THEME.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.summary}>{capture.summary}</Text>
          {capture.fromAi ? (
            <Text style={styles.aiBadge}>{t('vaciar.aiPreviewFromAi')}</Text>
          ) : (
            <Text style={styles.aiBadge}>{t('vaciar.aiPreviewFromLocal')}</Text>
          )}

          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {allTasks.map((task, index) => (
              <View key={`${task.content}-${index}`} style={styles.row}>
                <Text style={styles.rowLabel}>
                  {index === 0 ? t('vaciar.aiPreviewMain') : t('vaciar.aiPreviewPrep', { n: index })}
                </Text>
                <Text style={styles.rowContent}>{task.content}</Text>
                <Text style={styles.rowMeta}>
                  {task.scheduled_date
                    ? t('vaciar.aiPreviewDate', { date: formatDate(task.scheduled_date) })
                    : t('vaciar.aiPreviewNoDate')}
                  {task.effort ? ` · ${effortLabel(task.effort)}` : ''}
                </Text>
              </View>
            ))}
          </ScrollView>

          <Text style={styles.hint}>{t('vaciar.aiPreviewHint')}</Text>

          <CalmPrimaryButton
            label={t('vaciar.aiPreviewConfirm')}
            onPress={onConfirm}
            loading={isSaving}
            disabled={isSaving}
          />
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={onApplyToForm}
            disabled={isSaving}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={t('vaciar.aiPreviewApplyA11y')}
          >
            <Text style={styles.secondaryText}>{t('vaciar.aiPreviewApply')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: THEME.colors.fill[100],
    borderTopLeftRadius: THEME.borderRadius.rounded,
    borderTopRightRadius: THEME.borderRadius.rounded,
    paddingHorizontal: THEME.layout.screenPaddingX,
    paddingTop: THEME.spacing.md,
    paddingBottom: THEME.spacing.lg,
    gap: THEME.spacing.sm,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: THEME.spacing.sm,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    flex: 1,
  },
  title: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    flex: 1,
  },
  summary: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
  },
  aiBadge: {
    ...THEME.typography.meta,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
  },
  list: {
    maxHeight: 220,
  },
  listContent: {
    gap: THEME.spacing.sm,
  },
  row: {
    ...THEME.surfaces.muted,
    padding: THEME.spacing.sm,
    gap: 4,
  },
  rowLabel: {
    ...THEME.typography.meta,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  rowContent: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
  },
  rowMeta: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
  },
  hint: {
    ...THEME.typography.small,
    color: THEME.colors.text.tertiary,
    lineHeight: 18,
  },
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: THEME.spacing.sm,
  },
  secondaryText: {
    ...THEME.typography.caption,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
  },
});
