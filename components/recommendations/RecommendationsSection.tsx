import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { generatePersonalizedRecommendations, type Recommendation, type UserPreferences, type CheckInContext } from '@/lib/personalizedRecommendations';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { X, Sparkles } from 'lucide-react-native';

// Mapeo de categorías a emojis/ilustraciones
const CATEGORY_ILLUSTRATIONS: Record<string, { emoji: string; gradient: [string, string, ...string[]]; title: string }> = {
  'salud mental': {
    emoji: '🧘',
    gradient: [THEME.colors.gradient.blue, THEME.colors.gradient.pink],
    title: 'Salud Mental',
  },
  'ejercicio': {
    emoji: '💪',
    gradient: [THEME.colors.gradient.pink, '#FF6B6B'],
    title: 'Ejercicio',
  },
  'productividad': {
    emoji: '📚',
    gradient: [THEME.colors.gradient.blue, '#4A90E2'],
    title: 'Productividad',
  },
  'bienestar': {
    emoji: '✨',
    gradient: [THEME.colors.gradient.pink, '#FFD700'],
    title: 'Bienestar',
  },
  'social': {
    emoji: '👥',
    gradient: [THEME.colors.gradient.blue, '#9B59B6'],
    title: 'Social',
  },
  'creatividad': {
    emoji: '🎨',
    gradient: [THEME.colors.gradient.pink, '#FF1493'],
    title: 'Creatividad',
  },
  'descanso': {
    emoji: '😴',
    gradient: [THEME.colors.gradient.blue, '#00CED1'],
    title: 'Descanso',
  },
  'nutrición': {
    emoji: '🥗',
    gradient: [THEME.colors.gradient.pink, '#32CD32'],
    title: 'Nutrición',
  },
};

// Función para determinar la categoría de una recomendación
const getRecommendationCategory = (recommendation: Recommendation): string => {
  const titleLower = recommendation.title.toLowerCase();
  const messageLower = recommendation.message.toLowerCase();
  
  if (titleLower.includes('meditar') || titleLower.includes('mindfulness') || messageLower.includes('salud mental')) {
    return 'salud mental';
  }
  if (titleLower.includes('ejercicio') || titleLower.includes('entrenar') || titleLower.includes('correr')) {
    return 'ejercicio';
  }
  if (titleLower.includes('productividad') || titleLower.includes('organizar') || titleLower.includes('tarea')) {
    return 'productividad';
  }
  if (titleLower.includes('bienestar') || titleLower.includes('cuidar')) {
    return 'bienestar';
  }
  if (titleLower.includes('social') || titleLower.includes('amigos') || titleLower.includes('conectar')) {
    return 'social';
  }
  if (titleLower.includes('creatividad') || titleLower.includes('crear') || titleLower.includes('arte')) {
    return 'creatividad';
  }
  if (titleLower.includes('descanso') || titleLower.includes('dormir') || titleLower.includes('relajar')) {
    return 'descanso';
  }
  if (titleLower.includes('nutrición') || titleLower.includes('comida') || titleLower.includes('aliment')) {
    return 'nutrición';
  }
  
  // Default basado en el tipo
  if (recommendation.type === 'wellness') return 'bienestar';
  if (recommendation.type === 'productivity') return 'productividad';
  if (recommendation.type === 'social') return 'social';
  return 'bienestar';
};

interface RecommendationsSectionProps {
  userId: string;
}

export function RecommendationsSection({ userId }: RecommendationsSectionProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadRecommendations();
  }, [userId]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);

      // Cargar perfil del usuario
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('age, favorite_activities, interests, other_preferences')
        .eq('id', userId)
        .single();

      if (profileError) {
        logger.error('Error loading profile for recommendations:', profileError);
      }

      // Cargar check-in de hoy
      const today = new Date().toISOString().split('T')[0];
      const { data: checkInData, error: checkInError } = await supabase
        .from('daily_check_ins')
        .select('emotion, energy_level, available_time, focus_level')
        .eq('user_id', userId)
        .eq('date', today)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (checkInError) {
        logger.error('Error loading check-in for recommendations:', checkInError);
      }

      // Preparar datos para recomendaciones
      const preferences: UserPreferences = {
        age: profileData?.age,
        favorite_activities: profileData?.favorite_activities || [],
        interests: profileData?.interests || [],
        other_preferences: profileData?.other_preferences || {},
      };

      const checkIn: CheckInContext = checkInData
        ? {
            emotion: checkInData.emotion || 'Normal',
            energyLevel: checkInData.energy_level || 3,
            availableTime: checkInData.available_time || 'Medio (2-4hrs)',
            focusLevel: checkInData.focus_level || 'Normal',
          }
        : {
            emotion: 'Normal',
            energyLevel: 3,
            availableTime: 'Medio (2-4hrs)',
            focusLevel: 'Normal',
          };

      // Generar recomendaciones
      const generatedRecommendations = generatePersonalizedRecommendations(preferences, checkIn);
      setRecommendations(generatedRecommendations);
    } catch (error) {
      logger.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecommendationPress = (recommendation: Recommendation) => {
    setSelectedRecommendation(recommendation);
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Recomendaciones para ti</Text>
        <Text style={styles.loadingText}>Cargando recomendaciones...</Text>
      </View>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  // Agrupar recomendaciones por categoría
  const recommendationsByCategory = new Map<string, Recommendation[]>();
  recommendations.forEach((rec) => {
    const category = getRecommendationCategory(rec);
    if (!recommendationsByCategory.has(category)) {
      recommendationsByCategory.set(category, []);
    }
    recommendationsByCategory.get(category)!.push(rec);
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Recomendaciones para ti</Text>
        <Sparkles size={20} color={THEME.colors.gradient.blue} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {Array.from(recommendationsByCategory.entries()).map(([category, categoryRecs]) => {
          const illustration = CATEGORY_ILLUSTRATIONS[category] || CATEGORY_ILLUSTRATIONS['bienestar'];
          const mainRecommendation = categoryRecs[0]; // Mostrar la primera recomendación de cada categoría

          return (
            <TouchableOpacity
              key={category}
              style={styles.recommendationCard}
              onPress={() => handleRecommendationPress(mainRecommendation)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Recomendación: ${illustration.title}`}
            >
              <LinearGradient
                colors={illustration.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <View style={styles.cardContent}>
                  <Text style={styles.emoji}>{illustration.emoji}</Text>
                  <Text style={styles.categoryTitle}>{illustration.title}</Text>
                  <Text style={styles.recommendationTitle} numberOfLines={2}>
                    {mainRecommendation.title}
                  </Text>
                  <Text style={styles.recommendationMessage} numberOfLines={2}>
                    {mainRecommendation.message}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Modal de detalle */}
      <Modal
        visible={showDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedRecommendation && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Recomendación</Text>
                  <TouchableOpacity
                    onPress={() => setShowDetailModal(false)}
                    style={styles.closeButton}
                    accessibilityRole="button"
                    accessibilityLabel="Cerrar"
                  >
                    <X size={24} color={THEME.colors.text.main} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                  <View style={styles.modalBody}>
                    <Text style={styles.modalEmoji}>
                      {CATEGORY_ILLUSTRATIONS[getRecommendationCategory(selectedRecommendation)]?.emoji || '✨'}
                    </Text>
                    <Text style={styles.modalRecommendationTitle}>
                      {selectedRecommendation.title}
                    </Text>
                    <Text style={styles.modalRecommendationMessage}>
                      {selectedRecommendation.message}
                    </Text>
                    {selectedRecommendation.suggestion && (
                      <View style={styles.suggestionBox}>
                        <Text style={styles.suggestionLabel}>Sugerencia:</Text>
                        <Text style={styles.suggestionText}>{selectedRecommendation.suggestion}</Text>
                      </View>
                    )}
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: THEME.spacing.xl,
    marginBottom: THEME.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
  },
  sectionTitle: {
    ...THEME.typography.h2,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  loadingText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    padding: THEME.spacing.lg,
  },
  scrollContent: {
    paddingHorizontal: THEME.spacing.lg,
    gap: THEME.spacing.md,
  },
  recommendationCard: {
    width: 280,
    height: 200,
    borderRadius: THEME.borderRadius.rounded,
    overflow: 'hidden',
    ...THEME.shadows.soft,
  },
  cardGradient: {
    flex: 1,
    padding: THEME.spacing.lg,
    justifyContent: 'space-between',
  },
  cardContent: {
    flex: 1,
  },
  emoji: {
    fontSize: 48,
    marginBottom: THEME.spacing.sm,
  },
  categoryTitle: {
    ...THEME.typography.caption,
    color: '#FFFFFF',
    opacity: 0.9,
    fontFamily: THEME.fonts.heading.medium,
    marginBottom: THEME.spacing.xs,
  },
  recommendationTitle: {
    ...THEME.typography.h3,
    color: '#FFFFFF',
    fontFamily: THEME.fonts.heading.bold,
    marginBottom: THEME.spacing.xs,
  },
  recommendationMessage: {
    ...THEME.typography.body,
    color: '#FFFFFF',
    opacity: 0.9,
    fontSize: 13,
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
  modalScroll: {
    flex: 1,
  },
  modalBody: {
    padding: THEME.spacing.lg,
    alignItems: 'center',
  },
  modalEmoji: {
    fontSize: 64,
    marginBottom: THEME.spacing.md,
  },
  modalRecommendationTitle: {
    ...THEME.typography.h2,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    textAlign: 'center',
    marginBottom: THEME.spacing.md,
  },
  modalRecommendationMessage: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: THEME.spacing.lg,
  },
  suggestionBox: {
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    width: '100%',
  },
  suggestionLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
    marginBottom: THEME.spacing.xs,
  },
  suggestionText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
  },
});
