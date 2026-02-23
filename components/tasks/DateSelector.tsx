import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { useState, useMemo } from 'react';
import { THEME } from '@/constants/theme';
import { Calendar, X } from 'lucide-react-native';

interface DateSelectorProps {
  selectedDate: string | null;
  onSelect: (date: string | null) => void;
}

const MONTH_NAMES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function getNextDays(count: number): string[] {
  const out: string[] = [];
  const d = new Date();
  for (let i = 0; i < count; i++) {
    out.push(d.toISOString().split('T')[0]);
    d.setDate(d.getDate() + 1);
  }
  return out;
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  if (dateStr === todayStr) return 'Hoy';
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (dateStr === tomorrow.toISOString().split('T')[0]) return 'Mañana';
  const day = dateStr.slice(8);
  const month = MONTH_NAMES[parseInt(dateStr.slice(5, 7), 10) - 1];
  return `${day} ${month}`;
}

export function DateSelector({ selectedDate, onSelect }: DateSelectorProps) {
  const [showModal, setShowModal] = useState(false);

  const dateOptions = useMemo(() => {
    const options: { label: string; value: string | null }[] = [
      { label: 'Sin fecha', value: null },
    ];
    const nextDays = getNextDays(33);
    nextDays.forEach((dateStr) => {
      options.push({ label: formatDateLabel(dateStr), value: dateStr });
    });
    return options;
  }, []);

  const displayLabel = selectedDate
    ? formatDateLabel(selectedDate)
    : 'Sin fecha';

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Fecha (opcional)</Text>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setShowModal(true)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Elegir fecha"
      >
        <Calendar size={20} color={THEME.colors.gradient.blue} />
        <Text style={styles.selectorText}>{displayLabel}</Text>
      </TouchableOpacity>

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
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Elegir fecha</Text>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={styles.modalClose}
                accessibilityLabel="Cerrar"
              >
                <X size={24} color={THEME.colors.text.main} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {dateOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.value ?? 'null'}
                  style={styles.optionRow}
                  onPress={() => {
                    onSelect(opt.value);
                    setShowModal(false);
                  }}
                  activeOpacity={0.7}
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
});
