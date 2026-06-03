import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { useState, useMemo } from 'react';
import { THEME } from '@/constants/theme';
import { Calendar, X } from 'lucide-react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useI18n } from '@/contexts/I18nContext';
import { getLocalDateString, parseLocalDateString } from '@/lib/dateLocal';
import { AddToDeviceCalendarButton } from '@/components/tasks/AddToDeviceCalendarButton';

const MONTH_NAMES_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'] as const;
const MONTH_NAMES_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

interface DateSelectorProps {
  selectedDate: string | null;
  onSelect: (date: string | null) => void;
  /** Título de la tarea en edición (para agregar al Calendario del dispositivo). */
  calendarTaskTitle?: string;
  /** Id estable para evitar duplicados al agregar desde el formulario. */
  calendarTaskId?: string;
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
  calendarTaskTitle,
  calendarTaskId = 'draft-task',
}: DateSelectorProps) {
  const { t, locale } = useI18n();
  const monthNames = locale === 'en' ? MONTH_NAMES_EN : MONTH_NAMES_ES;
  const [showModal, setShowModal] = useState(false);
  const [showNativePicker, setShowNativePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState<Date>(new Date());

  const dateOptions = useMemo(() => {
    const options: { label: string; value: string | null }[] = [{ label: t('components.noDate'), value: null }];
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
    }
    setShowNativePicker(false);
    setShowModal(true);
  };

  const handleNativeDateChange = (event: DateTimePickerEvent, date?: Date) => {
    if (event.type === 'dismissed') {
      setShowNativePicker(false);
      return;
    }
    if (!date) return;
    setPickerDate(date);
    onSelect(getLocalDateString(date));
    setShowNativePicker(false);
    setShowModal(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('components.dateOptional')}</Text>
      <TouchableOpacity
        style={styles.selector}
        onPress={openModal}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={t('components.pickDateA11y')}
        accessibilityHint={t('components.pickDateHint')}
      >
        <Calendar size={20} color={THEME.colors.gradient.blue} />
        <Text style={styles.selectorText}>{displayLabel}</Text>
      </TouchableOpacity>

      {selectedDate && calendarTaskTitle?.trim() ? (
        <AddToDeviceCalendarButton
          taskId={calendarTaskId}
          title={calendarTaskTitle}
          scheduledDate={selectedDate}
          variant="row"
        />
      ) : null}

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowModal(false)}
          accessibilityRole="button"
          accessibilityLabel={t('components.closeDatePickerA11y')}
          accessibilityHint={t('components.closeDatePickerHint')}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('components.pickDateTitle')}</Text>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={styles.modalClose}
                accessibilityRole="button"
                accessibilityLabel={t('components.closeA11y')}
                accessibilityHint={t('components.closeDatePickerHint')}
              >
                <X size={24} color={THEME.colors.text.main} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.optionRow, styles.calendarOption]}
                onPress={() => setShowNativePicker(true)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={t('components.openCalendarA11y')}
                accessibilityHint={t('components.openCalendarHint')}
              >
                <View style={styles.calendarOptionLeft}>
                  <Calendar size={18} color={THEME.colors.gradient.blue} />
                  <Text style={styles.calendarOptionText}>{t('components.openCalendar')}</Text>
                </View>
                <Text style={styles.calendarOptionSubtext}>
                  {selectedDate ? formatDateLabel(selectedDate, t, monthNames) : t('components.noDate')}
                </Text>
              </TouchableOpacity>

              {showNativePicker && (
                <View style={styles.nativePickerWrap}>
                  <DateTimePicker
                    value={pickerDate}
                    mode="date"
                    display="default"
                    minimumDate={new Date()}
                    onChange={handleNativeDateChange}
                  />
                </View>
              )}

              {dateOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.value ?? 'null'}
                  style={styles.optionRow}
                  onPress={() => {
                    onSelect(opt.value);
                    if (opt.value) {
                      const parsed = new Date(`${opt.value}T00:00:00`);
                      if (!Number.isNaN(parsed.getTime())) {
                        setPickerDate(parsed);
                      }
                    }
                    setShowModal(false);
                  }}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={
                    opt.value ? t('components.chooseDateA11y', { label: opt.label }) : t('components.clearDateA11y')
                  }
                  accessibilityHint={t('components.chooseDateHint')}
                  accessibilityState={{ selected: selectedDate === opt.value }}
                >
                  <Text style={styles.optionText}>{opt.label}</Text>
                  {selectedDate === opt.value && (
                    <Text style={styles.optionCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: THEME.spacing.md,
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
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
  },
  selectorText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: THEME.colors.overlayLight,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: THEME.colors.fill[100],
    borderTopLeftRadius: THEME.borderRadius.rounded * 2,
    borderTopRightRadius: THEME.borderRadius.rounded * 2,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: THEME.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.stroke[100],
  },
  modalTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
  },
  modalClose: {
    padding: THEME.spacing.xs,
  },
  modalList: {
    padding: THEME.spacing.md,
    maxHeight: 320,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.standard,
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
  calendarOption: {
    marginBottom: THEME.spacing.xs,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
  },
  calendarOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
  },
  calendarOptionText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  calendarOptionSubtext: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
  },
  nativePickerWrap: {
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.standard,
    paddingHorizontal: THEME.spacing.sm,
    marginBottom: THEME.spacing.sm,
  },
});
