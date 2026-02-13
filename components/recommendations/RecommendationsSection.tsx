import { View, Text, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import { THEME } from '@/constants/theme';
import { Lightbulb } from 'lucide-react-native';

interface RecommendationsSectionProps {
  userId: string;
}

export function RecommendationsSection({ userId }: RecommendationsSectionProps) {
  const [recommendations, setRecommendations] = useState<string[]>([]);

  useEffect(() => {
    setRecommendations([
      'Completa las tareas prioritarias primero',
      'Toma descansos regulares cada hora',
      'Mantén tu espacio de trabajo organizado',
    ]);
  }, [userId]);

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Lightbulb size={20} color={THEME.colors.gradient.blue} />
        <Text style={styles.title}>Recomendaciones</Text>
      </View>
      {recommendations.map((rec, index) => (
        <View key={index} style={styles.recommendation}>
          <Text style={styles.recommendationText}>• {rec}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    marginTop: THEME.spacing.lg,
    marginHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    marginBottom: THEME.spacing.sm,
  },
  title: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  recommendation: {
    marginBottom: THEME.spacing.xs,
  },
  recommendationText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
  },
});
