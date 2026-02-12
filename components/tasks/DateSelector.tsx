import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { Calendar, X } from 'lucide-react-native';

interface DateSelectorProps {
  selectedDate: string | null;
  onSelect: (date: string | null) => void;
}

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAY_NAMES_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export function DateSelector({ selectedDate, onSelect }: DateSelectorProps) {
  const [showModal, setShowModal] = useState(false);

  const getWeekDates = () => {
    const dates: { date: string; dayName: string; dayNumber: number; isToday: boolean }[] = [];
    const today = new Date();
    
    // Obtener el lunes de esta semana
    const monday = new Date(today);
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Ajustar para que lunes sea 1
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);

    for (let i = 0; i < 14; i++) { // 2 semanas
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const todayStr = today.toISOString().split('T')[0];
      
      dates.push({
        date: dateStr,
        dayName: DAY_NAMES[date.getDay()],
        dayNumber: date.getDate(),
        isToday: dateStr === todayStr,
      });
    }
    
    return dates;
  };

  const weekDates = getWeekDates();
  const today = new Date().toISOString().split('T')[0];

  const formatSelectedDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    if (dateStr === todayStr) {
      return 'Hoy';
    }
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    if (dateStr === tomorrowStr) {
      return 'Mañana';
    }
    
    return `${DAY_NAMES_FULL[date.getDay()]} ${date.getDate()}`;
  };

  const handleSelect = (date: string | null) => {
    onSelect(date);
    setShowModal(false);
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setShowModal(true)}
        style={styles.selector}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={selectedDate ? `Fecha: ${formatSelectedDate(selectedDate)}` : 'Seleccionar fecha'}
      >
        {selectedDate ? (
          <View style={styles.selectedContainer}>
            <Calendar size={16} color={THEME.colors.gradient.blue} />
            <Text style={styles.selectedText}>{formatSelectedDate(selectedDate)}</Text>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleSelect(null);
              }}
              style={styles.clearButton}
              accessibilityRole="button"
              accessibilityLabel="Quitar fecha"
            >
              <X size={14} color={THEME.colors.text.secondary} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.unselectedContainer}>
            <Calendar size={16} color={THEME.colors.text.secondary} />
            <Text style={styles.unselectedText}>Programar para un día</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Fecha</Text>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
              >
                <X size={24} color={THEME.colors.text.main} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.datesList} showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                onPress={() => handleSelect(null)}
                style={[
                  styles.option,
                  selectedDate === null && styles.selectedOption,
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedDate === null && styles.selectedOptionText,
                  ]}
                >
                  Sin fecha específica
                </Text>
              </TouchableOpacity>

              {weekDates.map((dateInfo) => (
                <TouchableOpacity
                  key={dateInfo.date}
                  onPress={() => handleSelect(dateInfo.date)}
                  style={[
                    styles.dateOption,
                    selectedDate === dateInfo.date && styles.selectedDateOption,
                    dateInfo.isToday && styles.todayOption,
                  ]}
                >
                  <View style={styles.dateInfo}>
                    <Text
                      style={[
                        styles.dayName,
                        selectedDate === dateInfo.date && styles.selectedDayName,
                        dateInfo.isToday && styles.todayDayName,
                      ]}
                    >
                      {dateInfo.dayName}
                    </Text>
                    <Text
                      style={[
                        styles.dayNumber,
                        selectedDate === dateInfo.date && styles.selectedDayNumber,
                        dateInfo.isToday && styles.todayDayNumber,
                      ]}
                    >
                      {dateInfo.dayNumber}
                    </Text>
                  </View>
                  {dateInfo.isToday && (
                    <View style={styles.todayBadge}>
                      <Text style={styles.todayBadgeText}>Hoy</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selector: {
    marginBottom: THEME.spacing.md,
  },
  selectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.fill[200],
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.standard,
    gap: THEME.spacing.xs,
  },
  selectedText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    flex: 1,
  },
  clearButton: {
    padding: 4,
  },
  unselectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.fill[200],
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.standard,
    borderWidth: 1,
    borderColor: THEME.colors.text.secondary,
    borderStyle: 'dashed',
    gap: THEME.spacing.xs,
  },
  unselectedText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: THEME.colors.fill[100],
    borderTopLeftRadius: THEME.borderRadius.rounded,
    borderTopRightRadius: THEME.borderRadius.rounded,
    maxHeight: '80%',
    paddingBottom: THEME.spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: THEME.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.fill[200],
  },
  modalTitle: {
    ...THEME.typography.h2,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  closeButton: {
    padding: THEME.spacing.xs,
  },
  datesList: {
    padding: THEME.spacing.lg,
  },
  option: {
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.standard,
    backgroundColor: THEME.colors.fill[200],
    marginBottom: THEME.spacing.sm,
  },
  selectedOption: {
    backgroundColor: THEME.colors.gradient.blue,
  },
  optionText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
  },
  selectedOptionText: {
    color: '#FFFFFF',
    fontFamily: THEME.fonts.heading.bold,
  },
  dateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.standard,
    backgroundColor: THEME.colors.fill[200],
    marginBottom: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedDateOption: {
    backgroundColor: THEME.colors.gradient.blue + '20',
    borderColor: THEME.colors.gradient.blue,
  },
  todayOption: {
    borderColor: THEME.colors.gradient.pink,
    borderWidth: 2,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.md,
  },
  dayName: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    minWidth: 40,
  },
  selectedDayName: {
    color: THEME.colors.gradient.blue,
  },
  todayDayName: {
    color: THEME.colors.gradient.pink,
  },
  dayNumber: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  selectedDayNumber: {
    color: THEME.colors.gradient.blue,
  },
  todayDayNumber: {
    color: THEME.colors.gradient.pink,
  },
  todayBadge: {
    backgroundColor: THEME.colors.gradient.pink,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.pill,
  },
  todayBadgeText: {
    ...THEME.typography.caption,
    color: '#FFFFFF',
    fontFamily: THEME.fonts.heading.bold,
    fontSize: 10,
  },
});
