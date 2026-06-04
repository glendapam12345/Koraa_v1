import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { CALENDAR_EMOTION_IDS, getEmotionCalendarAccent } from '@/lib/emotionCalendarColors';

export function SemanaCalendarLegend() {
  const { t } = useI18n();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      accessibilityRole="text"
      accessibilityLabel={t('semana.calendarLegendA11y')}
    >
      <View style={styles.item}>
        <View style={[styles.dot, { backgroundColor: THEME.colors.fill[200], borderWidth: 1, borderColor: THEME.colors.stroke[100] }]} />
        <Text style={styles.label}>{t('semana.legendNoCheckIn')}</Text>
      </View>
      {CALENDAR_EMOTION_IDS.map((id) => (
        <View key={id} style={styles.item}>
          <View style={[styles.dot, { backgroundColor: getEmotionCalendarAccent(id) }]} />
          <Text style={styles.label}>{t(`sentir.emotions.${id}` as 'sentir.emotions.tranquila')}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: THEME.spacing.xs,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  label: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
  },
});
