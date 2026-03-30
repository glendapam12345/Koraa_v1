import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { THEME } from '@/constants/theme';
import { generatePersonalizedRecommendations, type Recommendation, type UserPreferences, type CheckInContext } from '@/lib/personalizedRecommendations';
import { supabase } from '@/lib/supabase';
import { fetchProfilePreferences } from '@/lib/profilePreferences';
import { logger } from '@/lib/logger';
import { Sparkles, ChevronRight } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
/** Mismo valor para: margen izquierdo del carrusel, hueco entre tarjetas y “peek” de la siguiente (ritmo uniforme). */
const CAROUSEL_GUTTER = THEME.spacing.lg;
// W + gutter + peek = screen − padding; con gutter = peek = CAROUSEL_GUTTER y padding horizontal = CAROUSEL_GUTTER → W = screen − 3*gutter
const CARD_WIDTH = SCREEN_WIDTH - 3 * CAROUSEL_GUTTER;
const CARD_GAP = CAROUSEL_GUTTER;
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;
/** Altura fija para que todas las tarjetas del carrusel se vean iguales. */
const CARD_HEIGHT = 200;

const CATEGORY_KEYS = ['bienestar', 'ejercicio', 'productividad', 'salud mental', 'social', 'creatividad', 'descanso', 'nutrición'] as const;

function interestsToCategoryOrder(activities: string[] = [], interests: string[] = []): string[] {
  const combined = [...(activities || []), ...(interests || [])].map((s) => s.toLowerCase().trim());
  const order: string[] = [];
  const seen = new Set<string>();
  const map: Record<string, string> = {
    yoga: 'bienestar', meditación: 'salud mental', mindfulness: 'salud mental',
    correr: 'ejercicio', gym: 'ejercicio', ejercicio: 'ejercicio', deporte: 'ejercicio',
    leer: 'productividad', estudio: 'productividad', trabajo: 'productividad',
    amigos: 'social', social: 'social', familia: 'social',
    arte: 'creatividad', crear: 'creatividad', música: 'creatividad',
    descanso: 'descanso', dormir: 'descanso', sueño: 'descanso',
    comida: 'nutrición', alimentación: 'nutrición', nutrición: 'nutrición',
  };
  for (const item of combined) {
    for (const [key, cat] of Object.entries(map)) {
      if (item.includes(key) && !seen.has(cat)) {
        seen.add(cat);
        order.push(cat);
      }
    }
  }
  const rest = CATEGORY_KEYS.filter((c) => !seen.has(c));
  return [...order, ...rest];
}

// Mapeo de categorías a emojis/ilustraciones
const CATEGORY_ILLUSTRATIONS: Record<string, { emoji: string; gradient: [string, string, ...string[]]; title: string }> = {
  'salud mental': {
    emoji: '🧘',
    gradient: [THEME.colors.gradient.blue, THEME.colors.gradient.pink],
    title: 'Salud Mental',
  },
  'ejercicio': {
    emoji: '💪',
    gradient: [THEME.colors.gradient.pink, THEME.colors.gradient.pink],
    title: 'Ejercicio',
  },
  'productividad': {
    emoji: '📚',
    gradient: [THEME.colors.gradient.blue, THEME.colors.gradient.blue],
    title: 'Productividad',
  },
  'bienestar': {
    emoji: '✨',
    gradient: [THEME.colors.gradient.pink, THEME.colors.accent.yellow],
    title: 'Bienestar',
  },
  'social': {
    emoji: '👥',
    gradient: [THEME.colors.gradient.blue, THEME.colors.category.personal],
    title: 'Social',
  },
  'creatividad': {
    emoji: '🎨',
    gradient: [THEME.colors.gradient.pink, THEME.colors.gradient.pink],
    title: 'Creatividad',
  },
  'descanso': {
    emoji: '😴',
    gradient: [THEME.colors.gradient.blue, THEME.colors.gradient.blue],
    title: 'Descanso',
  },
  'nutrición': {
    emoji: '🥗',
    gradient: [THEME.colors.gradient.pink, THEME.colors.category.hogar],
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
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCategoryOrder, setUserCategoryOrder] = useState<string[]>([]);

  const loadRecommendations = useCallback(async () => {
    try {
      setLoading(true);

      const { data: prefs, error: profileError, extendedColumnsAvailable } =
        await fetchProfilePreferences(userId);

      if (profileError) {
        logger.error('Error loading profile for recommendations:', profileError);
      } else if (!extendedColumnsAvailable && prefs) {
        logger.warn(
          'Perfil sin columnas de personalización. Opcional: ejecuta en Supabase 20260321140000_ensure_profiles_personalization_columns.sql',
        );
      }

      const profileData = prefs;

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

      const activities = profileData?.favorite_activities ?? [];
      const interests = profileData?.interests ?? [];
      setUserCategoryOrder(interestsToCategoryOrder(activities, interests));

      const preferences: UserPreferences = {
        age: profileData?.age ?? undefined,
        favorite_activities: activities,
        interests,
        other_preferences: profileData?.other_preferences ?? {},
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
  }, [userId]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const handleRecommendationPress = (recommendation: Recommendation) => {
    router.push({
      pathname: '/(tabs)/vaciar',
      params: { suggestion: recommendation.title },
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.sectionTitle}>Recomendaciones para ti</Text>
          <Sparkles size={20} color={THEME.colors.gradient.blue} />
        </View>
        <Text style={styles.loadingText}>Cargando recomendaciones...</Text>
      </View>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  // Agrupar por categoría
  const recommendationsByCategory = new Map<string, Recommendation[]>();
  recommendations.forEach((rec) => {
    const category = getRecommendationCategory(rec);
    if (!recommendationsByCategory.has(category)) {
      recommendationsByCategory.set(category, []);
    }
    recommendationsByCategory.get(category)!.push(rec);
  });

  let categoryEntries = Array.from(recommendationsByCategory.entries())
    .sort(([catA, recsA], [catB, recsB]) => {
      const indexA = userCategoryOrder.indexOf(catA);
      const indexB = userCategoryOrder.indexOf(catB);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      const maxPrioA = Math.max(...recsA.map((r) => r.priority));
      const maxPrioB = Math.max(...recsB.map((r) => r.priority));
      return maxPrioB - maxPrioA;
    })
    .slice(0, 3);

  const filledEntries: [string, Recommendation[]][] = [...categoryEntries];
  const existingCats = new Set(filledEntries.map(([c]) => c));
  for (const cat of userCategoryOrder) {
    if (filledEntries.length >= 3) break;
    if (existingCats.has(cat)) continue;
    const illustration = CATEGORY_ILLUSTRATIONS[cat] || CATEGORY_ILLUSTRATIONS['bienestar'];
    const placeholderRec: Recommendation = {
      id: `placeholder-${cat}`,
      type: 'wellness',
      title: `Recomendaciones de ${illustration.title}`,
      message: 'Completa tu check-in diario en Sentir para ver sugerencias personalizadas aquí.',
      emoji: illustration.emoji,
      priority: 0,
    };
    filledEntries.push([cat, [placeholderRec]]);
    existingCats.add(cat);
  }
  categoryEntries = filledEntries.slice(0, 3);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.sectionTitle}>Recomendaciones para ti</Text>
          {categoryEntries.length > 1 ? (
            <Text style={styles.scrollHint}>Desliza a la derecha para ver más</Text>
          ) : null}
        </View>
        <Sparkles size={20} color={THEME.colors.gradient.blue} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScrollContent}
        snapToInterval={SNAP_INTERVAL}
        snapToAlignment="start"
        decelerationRate="fast"
      >
        {categoryEntries.map(([category, categoryRecs]) => {
          const illustration = CATEGORY_ILLUSTRATIONS[category] || CATEGORY_ILLUSTRATIONS['bienestar'];
          const mainRecommendation = categoryRecs[0];

          return (
            <TouchableOpacity
              key={category}
              style={[styles.horizontalCardWrap, { width: CARD_WIDTH, marginRight: CARD_GAP }]}
              onPress={() => handleRecommendationPress(mainRecommendation)}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel={`Agregar como tarea: ${mainRecommendation.title}`}
            >
              <LinearGradient
                colors={illustration.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.horizontalCardGradient, { height: CARD_HEIGHT }]}
              >
                <View style={styles.horizontalCardHeader}>
                  <View style={styles.cardHeaderContent}>
                    <Text style={styles.emoji}>{illustration.emoji}</Text>
                    <Text style={styles.categoryTitle}>{illustration.title}</Text>
                  </View>
                  <View style={styles.verMasChip}>
                    <Text style={styles.verMasChipText}>A tareas</Text>
                    <ChevronRight size={14} color={THEME.colors.onGradientMuted} />
                  </View>
                </View>
                <View style={styles.horizontalCardBody}>
                  <Text style={styles.horizontalCardTitle} numberOfLines={2}>
                    {mainRecommendation.title}
                  </Text>
                  <Text style={styles.horizontalCardPreview} numberOfLines={3}>
                    {mainRecommendation.message}
                  </Text>
                </View>
                <View style={styles.horizontalCardFooter}>
                  {categoryRecs.length > 1 ? (
                    <Text style={styles.horizontalCardMore}>
                      +{categoryRecs.length - 1} más en esta categoría
                    </Text>
                  ) : (
                    <Text style={styles.horizontalCardMorePlaceholder}> </Text>
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: THEME.spacing.sm,
    marginBottom: THEME.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.xs,
  },
  sectionTitle: {
    ...THEME.typography.h2,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  scrollHint: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    marginTop: 2,
  },
  loadingText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    padding: THEME.spacing.lg,
  },
  horizontalScrollContent: {
    paddingHorizontal: CAROUSEL_GUTTER,
    paddingBottom: THEME.spacing.xs,
  },
  verMasChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  verMasChipText: {
    ...THEME.typography.small,
    fontSize: 11,
    color: THEME.colors.onGradientMuted,
  },
  horizontalCardWrap: {
    borderRadius: THEME.borderRadius.rounded,
    overflow: 'hidden',
    ...THEME.shadows.soft,
  },
  horizontalCardGradient: {
    padding: THEME.spacing.md,
    minWidth: 0,
    justifyContent: 'space-between',
  },
  horizontalCardBody: {
    flex: 1,
    justifyContent: 'flex-start',
    minHeight: 0,
  },
  horizontalCardFooter: {
    minHeight: 20,
    justifyContent: 'flex-end',
  },
  horizontalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.sm,
  },
  horizontalCardTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
    marginBottom: THEME.spacing.xs,
  },
  horizontalCardPreview: {
    ...THEME.typography.small,
    color: THEME.colors.onGradient,
    opacity: 0.9,
    fontSize: 13,
    lineHeight: 20,
  },
  horizontalCardMore: {
    ...THEME.typography.small,
    color: THEME.colors.onGradient,
    opacity: 0.75,
    fontSize: 11,
  },
  horizontalCardMorePlaceholder: {
    fontSize: 11,
    opacity: 0,
  },
  verMasRecommendations: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.xs,
    paddingVertical: THEME.spacing.sm,
    marginTop: THEME.spacing.xs,
  },
  verMasRecommendationsText: {
    ...THEME.typography.body,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.medium,
    fontSize: 14,
  },
  recommendationCardWrapper: {
    marginBottom: THEME.spacing.sm,
  },
  recommendationCard: {
    borderRadius: THEME.borderRadius.rounded,
    overflow: 'hidden',
    ...THEME.shadows.soft,
  },
  cardGradient: {
    padding: THEME.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardHeaderContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: THEME.spacing.sm,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardHeaderRight: {
    alignItems: 'flex-end',
    gap: THEME.spacing.xs,
  },
  expandHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.colors.surfaceOverlay.light,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  expandHintText: {
    ...THEME.typography.small,
    color: THEME.colors.onGradient,
    opacity: 0.8,
    fontSize: 10,
  },
  emoji: {
    fontSize: 32,
  },
  categoryTitle: {
    ...THEME.typography.caption,
    color: THEME.colors.onGradient,
    opacity: 0.9,
    fontFamily: THEME.fonts.heading.medium,
    fontSize: 11,
    marginBottom: 2,
  },
  recommendationTitle: {
    ...THEME.typography.body,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
    fontSize: 14,
    marginBottom: 4,
  },
  recommendationPreview: {
    ...THEME.typography.small,
    color: THEME.colors.onGradient,
    opacity: 0.85,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  expandedContent: {
    marginTop: THEME.spacing.md,
    paddingTop: THEME.spacing.md,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.surfaceOverlay.medium,
  },
  recommendationMessage: {
    ...THEME.typography.body,
    color: THEME.colors.onGradient,
    opacity: 0.95,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: THEME.spacing.sm,
  },
  additionalRecommendations: {
    marginTop: THEME.spacing.md,
    paddingTop: THEME.spacing.md,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.surfaceOverlay.medium,
  },
  additionalRecTitle: {
    ...THEME.typography.caption,
    color: THEME.colors.onGradient,
    opacity: 0.9,
    fontFamily: THEME.fonts.heading.medium,
    marginBottom: THEME.spacing.xs,
    fontSize: 12,
  },
  additionalRecItem: {
    paddingVertical: THEME.spacing.xs,
  },
  additionalRecText: {
    ...THEME.typography.body,
    color: THEME.colors.onGradient,
    opacity: 0.85,
    fontSize: 12,
  },
});
