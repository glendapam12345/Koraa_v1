import { View, Text, StyleSheet } from 'react-native';
import { memo, useMemo } from 'react';
import { THEME } from '@/constants/theme';
import { Sparkles } from 'lucide-react-native';

interface ValueCardProps {
  totalTasksBefore: number;
  prioritizedTasks: number;
}

export const ValueCard = memo(function ValueCard({ totalTasksBefore, prioritizedTasks }: ValueCardProps) {
  const tasksReduced = useMemo(
    () => totalTasksBefore - prioritizedTasks,
    [totalTasksBefore, prioritizedTasks]
  );

  return (
    <View style={styles.valueCard}>
      <View style={styles.valueHeader}>
        <Sparkles size={20} color={THEME.colors.gradient.blue} />
        <Text style={styles.valueTitle}>Tu día organizado</Text>
      </View>
      <View style={styles.valueRow}>
        <Text style={styles.valueLabel}>Tareas totales:</Text>
        <Text style={styles.valueNumber}>{totalTasksBefore}</Text>
      </View>
      <View style={styles.valueRow}>
        <Text style={styles.valueLabel}>Priorizadas para hoy:</Text>
        <Text style={styles.valueNumberHighlight}>{prioritizedTasks}</Text>
      </View>
      {tasksReduced > 0 ? (
        <Text style={styles.valueMessage}>
          Reducimos {tasksReduced} tarea{tasksReduced !== 1 ? 's' : ''} para enfocarte en lo esencial según cómo te sientes hoy
        </Text>
      ) : (
        <Text style={styles.valueMessage}>
          Todas tus tareas son relevantes para hoy. ¡Perfecto! 🎯
        </Text>
      )}
    </View>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.totalTasksBefore === nextProps.totalTasksBefore &&
    prevProps.prioritizedTasks === nextProps.prioritizedTasks
  );
});

const styles = StyleSheet.create({
  valueCard: {
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
    ...THEME.shadows.soft,
  },
  valueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    marginBottom: THEME.spacing.sm,
  },
  valueTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.xs,
  },
  valueLabel: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
  },
  valueNumber: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  valueNumberHighlight: {
    ...THEME.typography.h3,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
  },
  valueMessage: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    marginTop: THEME.spacing.xs,
    fontStyle: 'italic',
  },
});
