import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { X, Sparkles } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { isWeakCaptureResult } from '@/lib/taskCaptureQuality';
import { isUserListCapture } from '@/lib/taskCaptureParseLocal';
import type { TaskCaptureResult } from '@/lib/taskCaptureTypes';

export type TaskCaptureOrganizePreview = {
  placement: string;
  category?: string;
  date: string;
  effort: string;
};

type TaskCaptureAiPreviewProps = {
  visible: boolean;
  capture: TaskCaptureResult | null;
  rawInput?: string;
  isSaving: boolean;
  onConfirm: () => void;
  onApplyToForm: () => void;
  onClose: () => void;
  formatDate: (iso: string | null) => string;
  organizeContext?: TaskCaptureOrganizePreview | null;
};

export function TaskCaptureAiPreview({
  visible,
  capture,
  rawInput = '',
  isSaving,
  onConfirm,
  onApplyToForm,
  onClose,
  formatDate,
  organizeContext = null,
}: TaskCaptureAiPreviewProps) {
  const { t, locale } = useI18n();
  if (!capture) return null;

  const weakResult = rawInput.trim() ? isWeakCaptureResult(rawInput, capture, locale) : false;
  const isBatchList = isUserListCapture(capture);

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

          {weakResult ? (
            <Text style={styles.weakHint}>{t('vaciar.aiPreviewWeakResult')}</Text>
          ) : null}

          {organizeContext ? (
            <View style={styles.organizeCard}>
              <Text style={styles.organizeTitle}>{t('vaciar.batchPreviewOrganizeTitle')}</Text>
              <Text style={styles.organizeRow}>
                <Text style={styles.organizeLabel}>{t('vaciar.batchPreviewPlacement')}: </Text>
                {organizeContext.placement}
              </Text>
              {organizeContext.category ? (
                <Text style={styles.organizeRow}>
                  <Text style={styles.organizeLabel}>{t('vaciar.batchPreviewCategory')}: </Text>
                  {organizeContext.category}
                </Text>
              ) : null}
              <Text style={styles.organizeRow}>
                <Text style={styles.organizeLabel}>{t('vaciar.batchPreviewDate')}: </Text>
                {organizeContext.date}
              </Text>
              <Text style={styles.organizeRow}>
                <Text style={styles.organizeLabel}>{t('vaciar.batchPreviewEffort')}: </Text>
                {organizeContext.effort}
              </Text>
              <Text style={styles.organizeNote}>{t('vaciar.batchPreviewOrganizeNote')}</Text>
            </View>
          ) : null}

          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {allTasks.map((task, index) => (
              <View key={`${task.content}-${index}`} style={styles.row}>
                <Text style={styles.rowLabel}>
                  {isBatchList
                    ? t('vaciar.batchPreviewStep', { n: index + 1 })
                    : index === 0
                      ? t('vaciar.aiPreviewMain')
                      : t('vaciar.aiPreviewPrep', { n: index })}
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
            label={
              isBatchList && organizeContext
                ? t('vaciar.batchPreviewConfirm', { count: allTasks.length })
                : t('vaciar.aiPreviewConfirm')
            }
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
    backgroundColor: THEME.colors.overlayLight,
  },
  sheet: {
    backgroundColor: THEME.colors.calm.card,
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
  weakHint: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
    backgroundColor: THEME.colors.calm.mist,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.standard,
  },
  organizeCard: {
    ...THEME.surfaces.muted,
    padding: THEME.spacing.sm,
    gap: 4,
    borderColor: THEME.colors.calm.border,
  },
  organizeTitle: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
    marginBottom: 2,
  },
  organizeRow: {
    ...THEME.typography.small,
    color: THEME.colors.text.main,
    lineHeight: 20,
  },
  organizeLabel: {
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.secondary,
  },
  organizeNote: {
    ...THEME.typography.meta,
    color: THEME.colors.text.tertiary,
    lineHeight: 16,
    marginTop: 4,
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
