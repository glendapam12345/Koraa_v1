import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { THEME } from '@/constants/theme';
import { generatePersonalizedRecommendations, type Recommendation, type UserPreferences, type CheckInContext } from '@/lib/personalizedRecommendations';
import { supabase } from '@/lib/supabase';
import { fetchProfilePreferences } from '@/lib/profilePreferences';
import { logger } from '@/lib/logger';
import { ChevronRight } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
/** Mismo valor para: margen izquierdo del carrusel, hueco entre tarjetas y “peek” de la siguiente (ritmo uniforme). */
const CAROUSEL_GUTTER = THEME.spacing.lg;
// W + gutter + peek = screen − padding; con gutter = peek = CAROUSEL_GUTTER y padding horizontal = CAROUSEL_GUTTER → W = screen − 3*gutter
const CARD_WIDTH = SCREEN_WIDTH - 3 * CAROUSEL_GUTTER;
const CARD_GAP = CAROUSEL_GUTTER;
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;
/** Altura fija para alinear tarjetas del carrusel; el cuerpo recorta texto para no pisar el pie. */
const CARD_HEIGHT = 188;

/**
 * Un gradiente distinto por posición del carrusel (0, 1, 2) para que no se repita el mismo azul.
 * Orden fijo; el contenido sigue viniendo de la categoría detectada.
 */
const CAROUSEL_SLOT_GRADIENTS: readonly (readonly [string, string])[] = [
  [THEME.colors.gradient.blue, '#5B8FD9'],
  [THEME.colors.gradient.pink, '#E85D75'],
  ['#3EB489', THEME.colors.gradient.blue],
  [THEME.colors.category.personal, '#9B7EDE'],
  ['#F4A261', THEME.colors.accent.orange],
  ['#2A9D8F', '#48CAE4'],
] as const;

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

  const sectionHeader = () => (
    <View style={styles.simpleHeader}>
      <Text style={styles.simpleHeaderTitle}>Recomendaciones</Text>
      <LinearGradient
        colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.simpleHeaderAccent}
      />
      <Text style={styles.simpleHeaderSub}>Para tu día</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        {sectionHeader()}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScrollContent}
        >
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[styles.skeletonCardWrap, { width: CARD_WIDTH, marginRight: CARD_GAP }]}
            >
              <LinearGradient
                colors={[THEME.colors.tint.blue.veryFaint, THEME.colors.fill[100]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.skeletonCardInner, { height: CARD_HEIGHT }]}
              >
                <View style={styles.skeletonLineWide} />
                <View style={styles.skeletonLineNarrow} />
                <View style={styles.skeletonBlock} />
              </LinearGradient>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  if (recommendations.length === 0) {
    return (
      <View style={styles.container}>
        {sectionHeader()}
        <View style={styles.emptyRecommendations}>
          <LinearGradient
            colors={[THEME.colors.fill[100], THEME.colors.tint.blue.veryFaint]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.emptyCard}
          >
            <Text style={styles.emptyRecommendationsText}>
              Cuando tengamos datos de tu perfil y tu check-in de hoy, aquí verás ideas para añadir como tareas.
            </Text>
            <View style={styles.emptyRecoRow}>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/yo')}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Ir a perfil Yo"
                style={styles.emptyRecoPill}
              >
                <Text style={styles.emptyRecoPillText}>Ir a Yo</Text>
                <ChevronRight size={16} color={THEME.colors.gradient.blue} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/sentir')}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Ir a Sentir"
                style={styles.emptyRecoPill}
              >
                <Text style={styles.emptyRecoPillText}>Ir a Sentir</Text>
                <ChevronRight size={16} color={THEME.colors.gradient.blue} />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    );
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
      {sectionHeader()}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScrollContent}
        snapToInterval={SNAP_INTERVAL}
        snapToAlignment="start"
        decelerationRate="fast"
      >
        {categoryEntries.map(([category, categoryRecs], slotIndex) => {
          const illustration = CATEGORY_ILLUSTRATIONS[category] || CATEGORY_ILLUSTRATIONS['bienestar'];
          const mainRecommendation = categoryRecs[0];
          const slotGradient =
            CAROUSEL_SLOT_GRADIENTS[slotIndex % CAROUSEL_SLOT_GRADIENTS.length];

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
                colors={[...slotGradient]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.horizontalCardGradient, { height: CARD_HEIGHT }]}
              >
                <LinearGradient
                  pointerEvents="none"
                  colors={['rgba(255,255,255,0.28)', 'rgba(255,255,255,0)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0.85 }}
                  style={styles.cardShine}
                />
                <View style={styles.horizontalCardHeader}>
                  <View style={styles.cardHeaderContent}>
                    <View style={styles.emojiBubble}>
                      <Text style={styles.emoji}>{illustration.emoji}</Text>
                    </View>
                    <View style={styles.cardHeaderTextStack}>
                      <Text style={styles.categoryTitle}>{illustration.title}</Text>
                    </View>
                  </View>
                  <View style={styles.verMasChip}>
                    <Text style={styles.verMasChipText}>A Tareas</Text>
                    <ChevronRight size={14} color={THEME.colors.onGradientMuted} />
                  </View>
                </View>
                <View style={styles.horizontalCardBody}>
                  <Text style={styles.horizontalCardTitle} numberOfLines={2}>
                    {mainRecommendation.title}
                  </Text>
                  <Text style={styles.horizontalCardPreview} numberOfLines={2}>
                    {mainRecommendation.message}
                  </Text>
                </View>
                <View style={styles.horizontalCardFooter}>
                  {categoryRecs.length > 1 ? (
                    <Text style={styles.horizontalCardMore} numberOfLines={1}>
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
    marginTop: 0,
    marginBottom: THEME.spacing.xs,
  },
  simpleHeader: {
    marginHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.sm,
  },
  simpleHeaderTitle: {
    fontSize: 20,
    lineHeight: 26,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    letterSpacing: 0.2,
  },
  simpleHeaderAccent: {
    marginTop: 8,
    width: 44,
    height: 3,
    borderRadius: 2,
  },
  simpleHeaderSub: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.accent.italic,
  },
  skeletonCardWrap: {
    borderRadius: THEME.borderRadius.rounded,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
    ...THEME.shadows.soft,
  },
  skeletonCardInner: {
    padding: THEME.spacing.md,
    justifyContent: 'flex-start',
    gap: THEME.spacing.xs,
  },
  skeletonLineWide: {
    height: 12,
    borderRadius: 6,
    backgroundColor: THEME.colors.stroke[100],
    width: '72%',
  },
  skeletonLineNarrow: {
    height: 10,
    borderRadius: 5,
    backgroundColor: THEME.colors.fill[200],
    width: '40%',
  },
  skeletonBlock: {
    marginTop: THEME.spacing.sm,
    flex: 1,
    borderRadius: THEME.borderRadius.standard,
    backgroundColor: THEME.colors.stroke[100],
    opacity: 0.45,
    minHeight: 72,
  },
  emptyRecommendations: {
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: THEME.spacing.md,
  },
  emptyCard: {
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
    ...THEME.shadows.soft,
  },
  emptyRecommendationsText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
    marginBottom: THEME.spacing.md,
  },
  emptyRecoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.sm,
    alignItems: 'center',
  },
  emptyRecoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.fill[100],
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
  },
  emptyRecoPillText: {
    ...THEME.typography.small,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.gradient.blue,
    fontSize: 14,
  },
  horizontalScrollContent: {
    paddingHorizontal: CAROUSEL_GUTTER,
    paddingBottom: THEME.spacing.xs,
  },
  verMasChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.surfaceOverlay.strong,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceOverlay.borderMedium,
  },
  verMasChipText: {
    ...THEME.typography.small,
    fontSize: 11,
    color: THEME.colors.onGradientMuted,
  },
  cardShine: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: THEME.borderRadius.rounded,
  },
  horizontalCardWrap: {
    borderRadius: THEME.borderRadius.rounded,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.colors.surfaceOverlay.borderMedium,
    ...THEME.shadows.soft,
  },
  horizontalCardGradient: {
    padding: THEME.spacing.sm,
    minWidth: 0,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  horizontalCardBody: {
    flex: 1,
    justifyContent: 'flex-start',
    minHeight: 0,
    overflow: 'hidden',
  },
  horizontalCardFooter: {
    flexShrink: 0,
    justifyContent: 'flex-end',
    paddingTop: 6,
    minHeight: 22,
  },
  horizontalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.xs,
    flexShrink: 0,
  },
  horizontalCardTitle: {
    fontSize: 17,
    lineHeight: 22,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
    marginBottom: 6,
  },
  horizontalCardPreview: {
    ...THEME.typography.small,
    color: THEME.colors.onGradient,
    opacity: 0.92,
    fontSize: 12,
    lineHeight: 17,
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
    alignItems: 'center',
    flex: 1,
    gap: THEME.spacing.xs,
    minWidth: 0,
  },
  emojiBubble: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: THEME.colors.surfaceOverlay.strong,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.surfaceOverlay.borderStrong,
  },
  cardHeaderTextStack: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
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
    fontSize: 22,
  },
  categoryTitle: {
    ...THEME.typography.caption,
    color: THEME.colors.onGradient,
    opacity: 0.95,
    fontFamily: THEME.fonts.heading.bold,
    fontSize: 12,
    letterSpacing: 0.2,
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
