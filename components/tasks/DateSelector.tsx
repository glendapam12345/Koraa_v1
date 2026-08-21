import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Platform } from 'react-native';
import { useState, useMemo } from 'react';
import { THEME } from '@/constants/theme';
import { Calendar, ChevronRight, X } from 'lucide-react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useI18n } from '@/contexts/I18nContext';
import {
  calendarDateStringFromPicker,
  getLocalDateString,
  parseLocalDateString,
} from '@/lib/dateLocal';

const MONTH_NAMES_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'] as const;
const MONTH_NAMES_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

interface DateSelectorProps {
  selectedDate: string | null;
  onSelect: (date: string | null) => void;
  /** Título de la tarea en edición (para agregar al Calendario del dispositivo). */
  calendarTaskTitle?: string;
  /** Id estable para evitar duplicados al agregar desde el formulario. */
  calendarTaskId?: string;
  /** Solo fila compacta para abrir calendario (sin etiqueta duplicada). */
  compact?: boolean;
  hideLabel?: boolean;
}

function getNextDays(count: number): string[] {
  const out: string[] = [];
  const d = new Date();
  for (let i = 0; i < count; i++) {
    out.push(getLocalDateString(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

function formatDateLabel(
  dateStr: string,
  t: (key: string) => string,
  monthNames: readonly string[],
): string {
  const todayStr = getLocalDateString();
  if (dateStr === todayStr) return t('components.today');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (dateStr === getLocalDateString(tomorrow)) return t('components.tomorrow');
  const day = dateStr.slice(8);
  const month = monthNames[parseInt(dateStr.slice(5, 7), 10) - 1];
  return `${day} ${month}`;
}

export function DateSelector({
  selectedDate,
  onSelect,
  calendarTaskTitle: _calendarTaskTitle,
  calendarTaskId: _calendarTaskId = 'draft-task',
  compact = false,
  hideLabel = false,
}: DateSelectorProps) {
  const { t, locale } = useI18n();
  const monthNames = locale === 'en' ? MONTH_NAMES_EN : MONTH_NAMES_ES;
  const [showModal, setShowModal] = useState(false);
  const [showNativePicker, setShowNativePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState<Date>(new Date());

  const dateOptions = useMemo(() => {
    const options: { label: string; value: string | null }[] = [
      { label: t('components.noDate'), value: null },
    ];
    const nextDays = getNextDays(33);
    nextDays.forEach((dateStr) => {
      options.push({ label: formatDateLabel(dateStr, t, monthNames), value: dateStr });
    });
    return options;
  }, [t, monthNames]);

  const displayLabel = selectedDate
    ? formatDateLabel(selectedDate, t, monthNames)
    : t('components.noDate');

  const openModal = () => {
    if (selectedDate) {
      setPickerDate(parseLocalDateString(selectedDate));
    } else {
      setPickerDate(new Date());
    }
    setShowNativePicker(Platform.OS === 'ios');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setShowNativePicker(false);
  };

  const applyPickerDate = (date: Date) => {
    onSelect(calendarDateStringFromPicker(date));
    closeModal();
  };

  const handleNativeDateChange = (event: DateTimePickerEvent, date?: Date) => {
    if (event.type === 'dismissed') {
      if (Platform.OS === 'android') setShowNativePicker(false);
      return;
    }
    if (!date) return;
    setPickerDate(date);
    if (Platform.OS === 'android') {
      applyPickerDate(date);
    }
  };

  const triggerLabel = compact ? t('components.openCalendar') : displayLabel;
  const triggerSubtext = compact
    ? selectedDate
      ? displayLabel
      : t('components.openCalendarSub')
    : null;

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {!hideLabel ? <Text style={styles.label}>{t('components.dateOptional')}</Text> : null}
      <TouchableOpacity
        style={[
          styles.selector,
          compact && styles.selectorCompact,
          compact && selectedDate && styles.selectorCompactFilled,
        ]}
        onPress={openModal}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={compact ? t('components.openCalendarA11y') : t('components.pickDateA11y')}
        accessibilityHint={t('components.openCalendarHint')}
      >
        <View
          style={[
            styles.iconWrap,
            compact && styles.iconWrapCompact,
            selectedDate ? styles.iconWrapFilled : null,
          ]}
        >
          <Calendar
            size={compact ? 18 : 20}
            color={selectedDate ? THEME.colors.gradient.blue : THEME.colors.calm.lavenderDeep}
          />
        </View>
        <View style={styles.selectorTextWrap}>
          <Text style={[styles.selectorText, compact && styles.selectorTextCompact]}>
            {triggerLabel}
          </Text>
          {triggerSubtext ? (
            <Text
              style={[
                styles.selectorSubtext,
                selectedDate ? styles.selectorSubtextFilled : null,
              ]}
            >
              {triggerSubtext}
            </Text>
          ) : null}
        </View>
        {compact ? (
          <ChevronRight size={18} color={THEME.colors.text.secondary} />
        ) : null}
      </TouchableOpacity>

      {selectedDate && !compact ? (
        <Text style={styles.calendarHint}>{t('deviceCalendar.draftDateHint')}</Text>
      ) : null}

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={closeModal}
            accessibilityRole="button"
            accessibilityLabel={t('components.closeDatePickerA11y')}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleWrap}>
                <Text style={styles.modalTitle}>{t('components.pickDateTitle')}</Text>
                {selectedDate ? (
                  <Text style={styles.modalSubtitle}>{displayLabel}</Text>
                ) : null}
              </View>
              <TouchableOpacity
                onPress={closeModal}
                style={styles.modalClose}
                accessibilityRole="button"
                accessibilityLabel={t('components.closeA11y')}
                accessibilityHint={t('components.closeDatePickerHint')}
              >
                <X size={22} color={THEME.colors.text.main} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {showNativePicker ? (
                <View style={styles.calendarPanel}>
                  <DateTimePicker
                    value={pickerDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    minimumDate={new Date()}
                    onChange={handleNativeDateChange}
                    themeVariant="light"
                  />
                  {Platform.OS === 'ios' ? (
                    <TouchableOpacity
                      style={styles.confirmBtn}
                      onPress={() => applyPickerDate(pickerDate)}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityLabel={t('components.dateConfirm')}
                    >
                      <Text style={styles.confirmBtnText}>{t('components.dateConfirm')}</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.calendarCta}
                  onPress={() => setShowNativePicker(true)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={t('components.openCalendarA11y')}
                  accessibilityHint={t('components.openCalendarHint')}
                >
                  <View style={styles.calendarCtaIcon}>
                    <Calendar size={20} color={THEME.colors.gradient.blue} />
                  </View>
                  <View style={styles.calendarCtaTextWrap}>
                    <Text style={styles.calendarCtaText}>{t('components.openCalendar')}</Text>
                    <Text style={styles.calendarCtaSubtext}>{t('components.openCalendarSub')}</Text>
                  </View>
                  <ChevronRight size={18} color={THEME.colors.text.secondary} />
                </TouchableOpacity>
              )}

              <Text style={styles.quickLabel}>{t('components.dateQuickLabel')}</Text>

              {dateOptions.map((opt) => {
                const selected = selectedDate === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value ?? 'null'}
                    style={[styles.optionRow, selected && styles.optionRowSelected]}
                    onPress={() => {
                      onSelect(opt.value);
                      if (opt.value) {
                        setPickerDate(parseLocalDateString(opt.value));
                      }
                      closeModal();
                    }}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={
                      opt.value
                        ? t('components.chooseDateA11y', { label: opt.label })
                        : t('components.clearDateA11y')
                    }
                    accessibilityHint={t('components.chooseDateHint')}
                    accessibilityState={{ selected }}
                  >
                    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                      {opt.label}
                    </Text>
                    {selected ? <Text style={styles.optionCheck}>✓</Text> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: THEME.spacing.md,
  },
  containerCompact: {
    marginBottom: 0,
    marginTop: THEME.spacing.xs,
  },
  label: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.xs,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    backgroundColor: THEME.colors.calm.mist,
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  selectorCompact: {
    backgroundColor: THEME.colors.calm.card,
    borderColor: THEME.colors.tint.blue.border,
    minHeight: THEME.sizes.touchTarget,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.sm,
  },
  selectorCompactFilled: {
    backgroundColor: THEME.colors.tint.blue.veryFaint,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.calm.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  iconWrapCompact: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    borderColor: THEME.colors.tint.blue.border,
  },
  iconWrapFilled: {
    backgroundColor: THEME.colors.tint.blue.veryLight,
    borderColor: THEME.colors.tint.blue.border,
  },
  selectorTextWrap: {
    flex: 1,
    gap: 2,
  },
  selectorText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
  },
  selectorTextCompact: {
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  selectorSubtext: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
  },
  selectorSubtextFilled: {
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: THEME.colors.overlay,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: THEME.colors.calm.card,
    borderTopLeftRadius: THEME.borderRadius.rounded * 2,
    borderTopRightRadius: THEME.borderRadius.rounded * 2,
    borderTopWidth: 1,
    borderColor: THEME.colors.calm.border,
    maxHeight: '82%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.lg,
    paddingBottom: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.calm.border,
    gap: THEME.spacing.sm,
  },
  modalTitleWrap: {
    flex: 1,
    gap: 2,
  },
  modalTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
  },
  modalSubtitle: {
    ...THEME.typography.small,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.medium,
  },
  modalClose: {
    padding: THEME.spacing.xs,
    marginTop: -THEME.spacing.xs,
  },
  modalList: {
    paddingHorizontal: THEME.spacing.md,
    paddingBottom: THEME.spacing.lg,
    maxHeight: 520,
  },
  calendarPanel: {
    marginTop: THEME.spacing.sm,
    marginBottom: THEME.spacing.sm,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.calm.mist,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  confirmBtn: {
    marginTop: THEME.spacing.sm,
    minHeight: THEME.sizes.touchTarget,
    borderRadius: THEME.borderRadius.rounded,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.gradient.blue,
  },
  confirmBtnText: {
    ...THEME.typography.body,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
  },
  calendarCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    marginTop: THEME.spacing.sm,
    marginBottom: THEME.spacing.sm,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
    minHeight: THEME.sizes.touchTarget,
  },
  calendarCtaIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.calm.card,
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
  },
  calendarCtaTextWrap: {
    flex: 1,
    gap: 2,
  },
  calendarCtaText: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  calendarCtaSubtext: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
  },
  quickLabel: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.xs,
    marginTop: THEME.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.standard,
    marginBottom: 2,
  },
  optionRowSelected: {
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
  },
  optionText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
  },
  optionTextSelected: {
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.gradient.blue,
  },
  optionCheck: {
    ...THEME.typography.body,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
  },
  calendarHint: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
    marginTop: THEME.spacing.xs,
  },
});
