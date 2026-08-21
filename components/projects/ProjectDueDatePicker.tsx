import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Platform } from 'react-native';
import { useState, useMemo } from 'react';
import { THEME } from '@/constants/theme';
import { Calendar, X } from 'lucide-react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useI18n } from '@/contexts/I18nContext';
import { calendarDateStringFromPicker, getLocalDateString, parseLocalDateString } from '@/lib/dateLocal';
import { formatProjectDueDate } from '@/lib/projectProgress';

type ProjectDueDatePickerProps = {
  dueDate: string;
  onDueDateChange: (value: string) => void;
  showHint?: boolean;
  accentColor?: string;
  /** @deprecated Usa layout="compact" */
  nestedInModal?: boolean;
  /** create: chips visibles al crear proyecto. compact: selector colapsable en edición. */
  layout?: 'create' | 'compact';
  /** flat: sin caja propia (el padre ya da el contenedor uniforme). */
  surface?: 'card' | 'flat';
};

function addDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return getLocalDateString(d);
}

function DueDatePickerPanel({
  dueDate,
  onDueDateChange,
  accentColor,
  onDone,
  compact = false,
}: {
  dueDate: string;
  onDueDateChange: (value: string) => void;
  accentColor: string;
  onDone?: () => void;
  compact?: boolean;
}) {
  const { t } = useI18n();
  const today = useMemo(() => new Date(), []);
  const [showNativePicker, setShowNativePicker] = useState(!compact && Platform.OS === 'ios');
  const [pickerDate, setPickerDate] = useState<Date>(
    dueDate.trim() ? parseLocalDateString(dueDate) : new Date(),
  );

  const quickOptions = useMemo(
    () => [
      { label: t('projects.dueDateQuickWeek'), value: addDays(today, 7) },
      { label: t('projects.dueDateQuickTwoWeeks'), value: addDays(today, 14) },
      { label: t('projects.dueDateQuickMonth'), value: addDays(today, 30) },
    ],
    [t, today],
  );

  const applyDate = (iso: string) => {
    onDueDateChange(iso);
    onDone?.();
  };

  const handleNativeDateChange = (event: DateTimePickerEvent, date?: Date) => {
    if (event.type === 'dismissed') {
      if (Platform.OS === 'android') setShowNativePicker(false);
      return;
    }
    if (!date) return;
    setPickerDate(date);
    if (Platform.OS === 'android') {
      applyDate(calendarDateStringFromPicker(date));
    }
  };

  return (
    <View style={panelStyles.wrap}>
      {showNativePicker ? (
        <View style={panelStyles.nativePickerWrap}>
          <DateTimePicker
            value={pickerDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            minimumDate={today}
            onChange={handleNativeDateChange}
            themeVariant="light"
          />
          {Platform.OS === 'ios' ? (
            <TouchableOpacity
              style={[panelStyles.confirmBtn, { backgroundColor: accentColor }]}
              onPress={() => applyDate(calendarDateStringFromPicker(pickerDate))}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Text style={panelStyles.confirmBtnText}>{t('projects.dueDateConfirm')}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        <TouchableOpacity
          style={panelStyles.calendarCta}
          onPress={() => setShowNativePicker(true)}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <Calendar size={18} color={accentColor} />
          <Text style={panelStyles.calendarCtaText}>{t('projects.dueDatePickCalendar')}</Text>
        </TouchableOpacity>
      )}

      <Text style={panelStyles.quickLabel}>{t('projects.dueDateQuickLabel')}</Text>
      <View style={panelStyles.quickRow}>
        {quickOptions.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[panelStyles.quickChip, dueDate === opt.value && panelStyles.quickChipOn]}
            onPress={() => applyDate(opt.value)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityState={{ selected: dueDate === opt.value }}
          >
            <Text
              style={[
                panelStyles.quickChipText,
                dueDate === opt.value && panelStyles.quickChipTextOn,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[panelStyles.optionRow, !dueDate.trim() && panelStyles.optionRowSelected]}
        onPress={() => {
          onDueDateChange('');
          onDone?.();
        }}
        activeOpacity={0.85}
        accessibilityRole="button"
      >
        <Text style={panelStyles.optionText}>{t('projects.dueDateNoneChip')}</Text>
        {!dueDate.trim() ? <Text style={panelStyles.optionCheck}>✓</Text> : null}
      </TouchableOpacity>
    </View>
  );
}

function QuickDateChips({
  dueDate,
  onDueDateChange,
  accentColor,
}: {
  dueDate: string;
  onDueDateChange: (value: string) => void;
  accentColor: string;
}) {
  const { t, locale } = useI18n();
  const today = useMemo(() => new Date(), []);

  const options = useMemo(
    () => [
      { key: 'week', label: t('projects.dueDateQuickWeek'), value: addDays(today, 7) },
      { key: 'two', label: t('projects.dueDateQuickTwoWeeks'), value: addDays(today, 14) },
      { key: 'month', label: t('projects.dueDateQuickMonth'), value: addDays(today, 30) },
      { key: 'none', label: t('projects.dueDateNoneChip'), value: '' },
    ],
    [t, today],
  );

  return (
    <View style={createStyles.chipGrid}>
      {options.map((opt) => {
        const selected = opt.value === '' ? !dueDate.trim() : dueDate === opt.value;
        const dateHint = opt.value ? formatProjectDueDate(opt.value, locale) : null;
        return (
          <TouchableOpacity
            key={opt.key}
            style={[
              createStyles.chip,
              selected && {
                borderColor: accentColor,
                backgroundColor: THEME.colors.calm.lavender,
              },
            ]}
            onPress={() => onDueDateChange(opt.value)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityState={{ selected }}
          >
            <Text
              style={[
                createStyles.chipText,
                selected && { color: accentColor, fontFamily: THEME.fonts.heading.bold },
              ]}
            >
              {opt.label}
            </Text>
            {dateHint ? <Text style={createStyles.chipDateHint}>{dateHint}</Text> : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function ProjectDueDatePicker({
  dueDate,
  onDueDateChange,
  showHint = true,
  accentColor = THEME.colors.calm.lavenderDeep,
  nestedInModal = false,
  layout,
  surface = 'card',
}: ProjectDueDatePickerProps) {
  const resolvedLayout = layout ?? (nestedInModal ? 'compact' : 'compact');
  const { t, locale } = useI18n();
  const [showModal, setShowModal] = useState(false);
  const today = useMemo(() => new Date(), []);
  const quickPresetValues = useMemo(
    () => [addDays(today, 7), addDays(today, 14), addDays(today, 30), ''],
    [today],
  );

  const displayLabel = dueDate.trim()
    ? formatProjectDueDate(dueDate, locale) ?? dueDate
    : t('projects.dueDateTapToPick');

  const isCustomDate =
    dueDate.trim().length > 0 && !quickPresetValues.slice(0, 3).includes(dueDate);

  if (resolvedLayout === 'create') {
    const inner = (
      <>
        {surface === 'card' ? (
          <View style={createStyles.sectionHeader}>
            <Text style={createStyles.sectionTitle}>{t('projects.dueDateSectionTitle')}</Text>
            <View style={createStyles.optionalBadge}>
              <Text style={createStyles.optionalBadgeText}>{t('projects.dueDateOptionalBadge')}</Text>
            </View>
          </View>
        ) : null}
        {surface === 'card' ? (
          <Text style={createStyles.sectionSub}>{t('projects.dueDateSectionSubCreate')}</Text>
        ) : null}

        <QuickDateChips
          dueDate={dueDate}
          onDueDateChange={onDueDateChange}
          accentColor={accentColor}
        />

        {isCustomDate ? (
          <Text style={createStyles.customDateLabel}>
            {t('projects.dueDateSelected', { date: displayLabel })}
          </Text>
        ) : null}

        <TouchableOpacity
          style={createStyles.otherDateLink}
          onPress={() => setShowModal(true)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t('projects.dueDatePickCalendarCta')}
        >
          <Calendar size={16} color={accentColor} />
          <Text style={[createStyles.otherDateText, { color: accentColor }]}>
            {t('projects.dueDatePickOtherShort')}
          </Text>
        </TouchableOpacity>

        <Modal
          visible={showModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowModal(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.modalBackdrop}
              activeOpacity={1}
              onPress={() => setShowModal(false)}
            />
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('projects.dueDatePickTitle')}</Text>
                <TouchableOpacity
                  onPress={() => setShowModal(false)}
                  style={styles.modalClose}
                  accessibilityLabel={t('components.closeA11y')}
                >
                  <X size={24} color={THEME.colors.text.main} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
                <DueDatePickerPanel
                  dueDate={dueDate}
                  onDueDateChange={onDueDateChange}
                  accentColor={accentColor}
                  onDone={() => setShowModal(false)}
                  compact
                />
              </ScrollView>
            </View>
          </View>
        </Modal>
      </>
    );

    if (surface === 'flat') {
      return <View style={createStyles.flatWrap}>{inner}</View>;
    }

    return <View style={createStyles.container}>{inner}</View>;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.selector, dueDate.trim() ? styles.selectorFilled : null]}
        onPress={() => setShowModal(true)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={t('projects.dueDateA11y')}
        accessibilityHint={t('projects.dueDatePickHint')}
      >
        <View style={[styles.iconWrap, { backgroundColor: THEME.colors.tint.blue.veryFaint }]}>
          <Calendar size={20} color={accentColor} />
        </View>
        <View style={styles.selectorTextWrap}>
          <Text style={styles.selectorLabel}>{t('projects.dueDateLabel')}</Text>
          <Text style={[styles.selectorValue, dueDate.trim() && { color: accentColor }]}>
            {displayLabel}
          </Text>
        </View>
      </TouchableOpacity>

      {showHint ? <Text style={styles.hint}>{t('projects.dueDateHint')}</Text> : null}

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowModal(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('projects.dueDatePickTitle')}</Text>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={styles.modalClose}
                accessibilityLabel={t('components.closeA11y')}
              >
                <X size={24} color={THEME.colors.text.main} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <DueDatePickerPanel
                dueDate={dueDate}
                onDueDateChange={onDueDateChange}
                accentColor={accentColor}
                onDone={() => setShowModal(false)}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = StyleSheet.create({
  container: {
    marginTop: THEME.spacing.sm,
    gap: THEME.spacing.xs,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
  },
  flatWrap: {
    gap: THEME.spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    flexWrap: 'wrap',
  },
  sectionTitle: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  optionalBadge: {
    paddingHorizontal: THEME.spacing.xs,
    paddingVertical: 2,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.card,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  optionalBadgeText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
  },
  sectionSub: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
    marginBottom: THEME.spacing.sm,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.xs,
  },
  chip: {
    width: '48%',
    flexGrow: 1,
    minWidth: '46%',
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    backgroundColor: THEME.colors.calm.card,
    minHeight: 46,
    justifyContent: 'center',
    gap: 2,
  },
  chipText: {
    ...THEME.typography.small,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
  },
  chipDateHint: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
  },
  customDateLabel: {
    ...THEME.typography.small,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
    marginTop: THEME.spacing.xs,
  },
  otherDateLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: THEME.spacing.sm,
    marginTop: THEME.spacing.xs,
    minHeight: THEME.sizes.touchTarget,
  },
  otherDateText: {
    ...THEME.typography.small,
    fontFamily: THEME.fonts.heading.bold,
  },
});

const panelStyles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.xs,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.calm.mist,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  nativePickerWrap: {
    marginBottom: THEME.spacing.xs,
  },
  confirmBtn: {
    marginTop: THEME.spacing.sm,
    minHeight: THEME.sizes.touchTarget,
    borderRadius: THEME.borderRadius.rounded,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    ...THEME.typography.body,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
  },
  calendarCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.xs,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
    minHeight: THEME.sizes.touchTarget,
  },
  calendarCtaText: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  quickLabel: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.secondary,
    marginTop: THEME.spacing.xs,
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.xs,
  },
  quickChip: {
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.pill,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    backgroundColor: THEME.colors.calm.card,
  },
  quickChipOn: {
    borderColor: THEME.colors.gradient.blue,
    backgroundColor: THEME.colors.tint.blue.veryLight,
  },
  quickChipText: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
  },
  quickChipTextOn: {
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.standard,
    borderWidth: 1,
    borderColor: 'transparent',
    marginTop: THEME.spacing.xs,
  },
  optionRowSelected: {
    backgroundColor: THEME.colors.tint.blue.veryLight,
    borderColor: THEME.colors.gradient.blue,
  },
  optionText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
  },
  optionCheck: {
    ...THEME.typography.body,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
  },
});

const styles = StyleSheet.create({
  container: {
    gap: THEME.spacing.xs,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    backgroundColor: THEME.colors.calm.card,
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    minHeight: THEME.sizes.touchTarget,
  },
  selectorFilled: {
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    borderColor: THEME.colors.tint.blue.border,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: THEME.borderRadius.standard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorTextWrap: {
    flex: 1,
    gap: 2,
  },
  selectorLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
  },
  selectorValue: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
  },
  hint: {
    ...THEME.typography.caption,
    color: THEME.colors.text.tertiary,
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: THEME.colors.overlay,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: THEME.colors.calm.card,
    borderTopLeftRadius: THEME.borderRadius.rounded * 2,
    borderTopRightRadius: THEME.borderRadius.rounded * 2,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: THEME.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.calm.border,
  },
  modalTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
  },
  modalClose: {
    padding: THEME.spacing.xs,
  },
  modalBody: {
    padding: THEME.spacing.md,
    maxHeight: 420,
  },
});
