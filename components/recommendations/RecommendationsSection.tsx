import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { openVaciarCapture } from '@/lib/vaciarNavigation';
import { CHECK_IN_ROUTE } from '@/lib/checkInNavigation';
import { subscribeCheckInCelebration } from '@/lib/checkInCelebration';
import { THEME } from '@/constants/theme';
import { generatePersonalizedRecommendations, type Recommendation, type UserPreferences, type CheckInContext } from '@/lib/personalizedRecommendations';
import { supabase } from '@/lib/supabase';
import { fetchProfilePreferences } from '@/lib/profilePreferences';
import { getLocalDateString } from '@/lib/dateLocal';
import { logger } from '@/lib/logger';
import { ChevronRight } from 'lucide-react-native';
import { useI18n } from '@/contexts/I18nContext';

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
const CAROUSEL_SLOT_GRADIENTS = THEME.colors.carousel.slotGradients;

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
const CATEGORY_ILLUSTRATION_META: Record<
  string,
  { emoji: string; gradient: [string, string, ...string[]]; titleKey: string }
> = {
  'salud mental': {
    emoji: '🧘',
    gradient: [THEME.colors.gradient.blue, THEME.colors.gradient.pink],
    titleKey: 'recommendations.catMentalHealth',
  },
  ejercicio: {
    emoji: '💪',
    gradient: [THEME.colors.gradient.pink, THEME.colors.gradient.pink],
    titleKey: 'recommendations.catExercise',
  },
  productividad: {
    emoji: '📚',
    gradient: [THEME.colors.gradient.blue, THEME.colors.gradient.blue],
    titleKey: 'recommendations.catProductivity',
  },
  bienestar: {
    emoji: '✨',
    gradient: [THEME.colors.gradient.pink, THEME.colors.accent.yellow],
    titleKey: 'recommendations.catWellness',
  },
  social: {
    emoji: '👥',
    gradient: [THEME.colors.gradient.blue, THEME.colors.category.personal],
    titleKey: 'recommendations.catSocial',
  },
  creatividad: {
    emoji: '🎨',
    gradient: [THEME.colors.gradient.pink, THEME.colors.gradient.pink],
    titleKey: 'recommendations.catCreativity',
  },
  descanso: {
    emoji: '😴',
    gradient: [THEME.colors.gradient.blue, THEME.colors.gradient.blue],
    titleKey: 'recommendations.catRest',
  },
  nutrición: {
    emoji: '🥗',
    gradient: [THEME.colors.gradient.pink, THEME.colors.category.hogar],
    titleKey: 'recommendations.catNutrition',
  },
};

function getCategoryIllustration(
  cat: string,
  t: (key: string) => string,
): { emoji: string; gradient: [string, string, ...string[]]; title: string } {
  const meta = CATEGORY_ILLUSTRATION_META[cat] || CATEGORY_ILLUSTRATION_META.bienestar;
  return {
    emoji: meta.emoji,
    gradient: meta.gradient,
    title: t(meta.titleKey),
  };
}

function textMatches(text: string, keywords: string[]): boolean {
  return keywords.some((k) => text.includes(k));
}

/** Clasifica recomendaciones para el carrusel (keywords ES + EN). */
const getRecommendationCategory = (recommendation: Recommendation): string => {
  const titleLower = recommendation.title.toLowerCase();
  const messageLower = recommendation.message.toLowerCase();
  const combined = `${titleLower} ${messageLower}`;

  if (
    textMatches(combined, [
      'meditar', 'mindfulness', 'salud mental', 'mental health', 'meditation', 'meditate',
    ])
  ) {
    return 'salud mental';
  }
  if (
    textMatches(combined, [
      'ejercicio', 'entrenar', 'correr', 'exercise', 'workout', 'train', 'run', 'gym',
    ])
  ) {
    return 'ejercicio';
  }
  if (
    textMatches(combined, [
      'productividad', 'organizar', 'tarea', 'productivity', 'organize', 'task', 'focus',
    ])
  ) {
    return 'productividad';
  }
  if (textMatches(combined, ['bienestar', 'cuidar', 'wellness', 'self-care', 'care'])) {
    return 'bienestar';
  }
  if (
    textMatches(combined, [
      'social', 'amigos', 'conectar', 'friends', 'connect', 'family',
    ])
  ) {
    return 'social';
  }
  if (
    textMatches(combined, [
      'creatividad', 'crear', 'arte', 'creativity', 'create', 'art',
    ])
  ) {
    return 'creatividad';
  }
  if (
    textMatches(combined, [
      'descanso', 'dormir', 'relajar', 'rest', 'sleep', 'relax',
    ])
  ) {
    return 'descanso';
  }
  if (
    textMatches(combined, [
      'nutrición', 'comida', 'aliment', 'nutrition', 'food', 'eat', 'meal',
    ])
  ) {
    return 'nutrición';
  }

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
  const { t, locale } = useI18n();
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
      const today = getLocalDateString();
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
      const generatedRecommendations = generatePersonalizedRecommendations(preferences, checkIn, locale);
      setRecommendations(generatedRecommendations);
    } catch (error) {
      logger.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, locale]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  useEffect(() => {
    return subscribeCheckInCelebration(() => {
      loadRecommendations();
    });
  }, [loadRecommendations]);

  const handleRecommendationPress = (recommendation: Recommendation) => {
    openVaciarCapture({ suggestion: recommendation.title });
  };

  const sectionHeader = () => (
    <View style={styles.simpleHeader}>
      <Text style={styles.simpleHeaderTitle}>{t('recommendations.title')}</Text>
      <LinearGradient
        colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.simpleHeaderAccent}
      />
      <Text style={styles.simpleHeaderSub}>{t('recommendations.subtitle')}</Text>
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
                colors={[THEME.colors.tint.blue.veryFaint, THEME.colors.calm.card]}
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
            colors={[THEME.colors.calm.card, THEME.colors.tint.blue.veryFaint]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.emptyCard}
          >
            <Text style={styles.emptyRecommendationsText}>{t('recommendationsExtra.emptyBody')}</Text>
            <View style={styles.emptyRecoRow}>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/yo')}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={t('recommendationsExtra.goYoProfile')}
                style={styles.emptyRecoPill}
              >
                <Text style={styles.emptyRecoPillText}>{t('recommendationsExtra.goYo')}</Text>
                <ChevronRight size={16} color={THEME.colors.gradient.blue} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push(CHECK_IN_ROUTE)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={t('recommendationsExtra.goFeel')}
                style={styles.emptyRecoPill}
              >
                <Text style={styles.emptyRecoPillText}>{t('recommendationsExtra.goFeel')}</Text>
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
    const illustration = getCategoryIllustration(cat, t);
    const placeholderRec: Recommendation = {
      id: `placeholder-${cat}`,
      type: 'wellness',
      title: `${illustration.title}`,
      message: t('recommendations.empty'),
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
          const illustration = getCategoryIllustration(category, t);
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
              accessibilityLabel={t('recommendations.addAsTaskA11y', { title: mainRecommendation.title })}
            >
              <LinearGradient
                colors={[...slotGradient]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.horizontalCardGradient, { height: CARD_HEIGHT }]}
              >
                <LinearGradient
                  pointerEvents="none"
                  colors={[THEME.colors.surfaceOverlay.wash, 'transparent', 'transparent']}
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
                    <Text style={styles.verMasChipText}>{t('recommendationsExtra.goTasks')}</Text>
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
                      {t('recommendationsExtra.moreInCategory', { count: categoryRecs.length - 1 })}
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
    marginBottom: THEME.spacing.sm,
  },
  simpleHeaderTitle: {
    ...THEME.typography.sectionTitle,
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
    ...THEME.typography.meta,
    marginTop: 6,
    fontFamily: THEME.fonts.accent.italic,
  },
  skeletonCardWrap: {
    borderRadius: THEME.borderRadius.rounded,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
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
    backgroundColor: THEME.colors.calm.border,
    width: '72%',
  },
  skeletonLineNarrow: {
    height: 10,
    borderRadius: 5,
    backgroundColor: THEME.colors.calm.mist,
    width: '40%',
  },
  skeletonBlock: {
    marginTop: THEME.spacing.sm,
    flex: 1,
    borderRadius: THEME.borderRadius.standard,
    backgroundColor: THEME.colors.calm.border,
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
    backgroundColor: THEME.colors.calm.card,
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
  },
  emptyRecoPillText: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.gradient.blue,
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
    ...THEME.typography.meta,
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
    ...THEME.typography.cardTitle,
    color: THEME.colors.onGradient,
    marginBottom: 6,
  },
  horizontalCardPreview: {
    ...THEME.typography.small,
    color: THEME.colors.onGradient,
    opacity: 0.92,
    lineHeight: 17,
  },
  horizontalCardMore: {
    ...THEME.typography.meta,
    color: THEME.colors.onGradient,
    opacity: 0.75,
  },
  horizontalCardMorePlaceholder: {
    ...THEME.typography.meta,
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
    ...THEME.typography.caption,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.medium,
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
    ...THEME.typography.meta,
    color: THEME.colors.onGradient,
    opacity: 0.85,
  },
  emoji: {
    fontSize: THEME.typography.displayEmojiMd.fontSize,
  },
  categoryTitle: {
    ...THEME.typography.sectionEyebrow,
    color: THEME.colors.onGradient,
    opacity: 0.95,
    letterSpacing: 0.2,
  },
  recommendationTitle: {
    ...THEME.typography.caption,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
    marginBottom: 4,
  },
  recommendationPreview: {
    ...THEME.typography.meta,
    color: THEME.colors.onGradient,
    opacity: 0.85,
    marginTop: 2,
  },
  expandedContent: {
    marginTop: THEME.spacing.md,
    paddingTop: THEME.spacing.md,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.surfaceOverlay.medium,
  },
  recommendationMessage: {
    ...THEME.typography.meta,
    color: THEME.colors.onGradient,
    opacity: 0.95,
    marginBottom: THEME.spacing.sm,
  },
  additionalRecommendations: {
    marginTop: THEME.spacing.md,
    paddingTop: THEME.spacing.md,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.surfaceOverlay.medium,
  },
  additionalRecTitle: {
    ...THEME.typography.small,
    color: THEME.colors.onGradient,
    opacity: 0.9,
    fontFamily: THEME.fonts.heading.medium,
    marginBottom: THEME.spacing.xs,
  },
  additionalRecItem: {
    paddingVertical: THEME.spacing.xs,
  },
  additionalRecText: {
    ...THEME.typography.small,
    color: THEME.colors.onGradient,
    opacity: 0.85,
  },
});
