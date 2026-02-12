import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { Tooltip } from '@/components/Tooltip';
import { supabase } from '@/lib/supabase';
import { getEmotionTips } from '@/lib/emotionTips';
import { generatePersonalizedRecommendations } from '@/lib/personalizedRecommendations';
import { Lightbulb, Moon, Zap, Brain, Sparkles, Heart, Plus } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';

const EMOTIONS = [
  { id: 'agotada', emoji: '😔', label: 'Agotada', color: ['#667eea', '#764ba2'] },
  { id: 'tranquila', emoji: '😌', label: 'Tranquila', color: ['#f093fb', '#f5576c'] },
  { id: 'ansiosa', emoji: '😰', label: 'Ansiosa', color: ['#fa709a', '#fee140'] },
  { id: 'motivada', emoji: '✨', label: 'Motivada', color: ['#30cfd0', '#330867'] },
  { id: 'abrumada', emoji: '🥺', label: 'Abrumada', color: ['#a8edea', '#fed6e3'] },
  { id: 'enfocada', emoji: '🎯', label: 'Enfocada', color: ['#667eea', '#764ba2'] },
];

const CATEGORY_ICONS = {
  rest: Moon,
  action: Zap,
  mindset: Brain,
  productivity: Sparkles,
};

const CATEGORY_LABELS = {
  rest: 'Descanso',
  action: 'Acción',
  mindset: 'Mentalidad',
  productivity: 'Productividad',
};

const CATEGORY_COLORS = {
  rest: '#9B59B6',
  action: '#FF6B6B',
  mindset: '#4A90E2',
  productivity: '#30CFD0',
};

type UserProfile = {
  age?: number;
  favorite_activities?: string[];
  interests?: string[];
  other_preferences?: Record<string, any>;
};

export default function TipsScreen() {
  const [todayMood, setTodayMood] = useState<string>('');
  const [energyLevel, setEnergyLevel] = useState<number>(0);
  const [availableTime, setAvailableTime] = useState<string>('');
  const [focusLevel, setFocusLevel] = useState<string>('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const loadTodayCheckIn = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const { data: checkIn, error } = await supabase
        .from('daily_check_ins')
        .select('emotion, energy_level, available_time, focus_level')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (error) {
        console.error('Error cargando check-in:', error);
        setLoading(false);
        return;
      }

      if (checkIn) {
        setTodayMood(checkIn.emotion.toLowerCase());
        setEnergyLevel(checkIn.energy_level);
        setAvailableTime(checkIn.available_time);
        setFocusLevel(checkIn.focus_level || '');
      } else {
        setTodayMood('');
        setEnergyLevel(0);
        setAvailableTime('');
        setFocusLevel('');
      }

      // Cargar perfil del usuario
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('age, favorite_activities, interests, other_preferences')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error cargando perfil:', profileError);
        // No mostrar error al usuario aquí, solo continuar sin recomendaciones personalizadas
        // El usuario puede seguir usando la app sin problemas
        setUserProfile(null);
      } else if (profile) {
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
    } catch (error) {
      console.error('Error inesperado:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTodayCheckIn();
  }, [loadTodayCheckIn]);

  useFocusEffect(
    useCallback(() => {
      loadTodayCheckIn();
    }, [loadTodayCheckIn])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTodayCheckIn();
    setRefreshing(false);
  };

  const getEmotionData = () => {
    return EMOTIONS.find(e => e.id === todayMood) || null;
  };

  const emotionData = getEmotionData();
  const tips = todayMood ? getEmotionTips(todayMood) : [];
  
  // Agrupar tips por categoría
  const tipsByCategory = tips.reduce((acc, tip) => {
    if (!acc[tip.category]) {
      acc[tip.category] = [];
    }
    acc[tip.category].push(tip);
    return acc;
  }, {} as Record<string, typeof tips>);

  // Generar recomendaciones personalizadas
  const personalizedRecommendations = useMemo(() => {
    if (!todayMood) return [];
    
    // Si no hay perfil, retornar array vacío (se mostrarán solo tips genéricos)
    if (!userProfile) return [];
    
    try {
      return generatePersonalizedRecommendations(
        {
          age: userProfile.age,
          favorite_activities: userProfile.favorite_activities || [],
          interests: userProfile.interests || [],
          other_preferences: userProfile.other_preferences || {},
        },
        {
          emotion: todayMood,
          energyLevel,
          availableTime,
          focusLevel,
        }
      );
    } catch (error) {
      console.error('Error generando recomendaciones:', error);
      return []; // Retornar array vacío en caso de error
    }
  }, [todayMood, userProfile, energyLevel, availableTime, focusLevel]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={THEME.colors.gradient.blue}
            colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
          />
        }
      >
        {!todayMood ? (
          // Sin check-in hoy
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Lightbulb size={64} color={THEME.colors.gradient.blue} />
            </View>
            <Text style={styles.emptyTitle}>Tips personalizados</Text>
            <Text style={styles.emptyMessage}>
              Haz tu check-in diario en <Text style={styles.emptyAccent}>Sentir</Text> para ver tips personalizados según cómo te sientes hoy
            </Text>
            <View style={styles.emptyActionContainer}>
              <Text style={styles.emptyActionText}>
                Ve a la tab <Text style={styles.emptyAccent}>Sentir</Text> y registra cómo te sientes
              </Text>
            </View>
          </View>
        ) : emotionData ? (
          // Con check-in - mostrar tips del estado actual
          <>
            {/* Header con estado actual */}
            <View style={styles.header}>
              <LinearGradient
                colors={emotionData.color as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.emotionHeader}
              >
                <Text style={styles.emotionEmoji}>{emotionData.emoji}</Text>
                <View style={styles.emotionHeaderContent}>
                  <Text style={styles.emotionLabel}>Te sientes</Text>
                  <Text style={styles.emotionName}>{emotionData.label}</Text>
                </View>
              </LinearGradient>
            </View>

            {/* Recomendaciones personalizadas */}
            {personalizedRecommendations.length > 0 && (
              <View style={styles.recommendationsSection}>
                <View style={styles.recommendationsHeader}>
                  <Sparkles size={20} color={THEME.colors.gradient.pink} />
                  <Text style={styles.recommendationsTitle}>Recomendaciones para ti</Text>
                </View>
                {personalizedRecommendations.map((rec) => (
                  <View key={rec.id} style={styles.recommendationCard}>
                    <Text style={styles.recommendationEmoji}>{rec.emoji}</Text>
                    <View style={styles.recommendationContent}>
                      <Text style={styles.recommendationTitle}>{rec.title}</Text>
                      <Text style={styles.recommendationMessage}>{rec.message}</Text>
                      {rec.suggestion && rec.suggestion.trim() && (
                        <TouchableOpacity
                          style={styles.suggestionButton}
                          onPress={() => {
                            // Validar que suggestion no esté vacío antes de navegar
                            if (rec.suggestion && rec.suggestion.trim()) {
                              router.push({
                                pathname: '/(tabs)/vaciar',
                                params: { suggestion: rec.suggestion.trim() },
                              });
                            }
                          }}
                          activeOpacity={0.7}
                        >
                          <Plus size={16} color={THEME.colors.gradient.blue} />
                          <Text style={styles.suggestionButtonText}>Agregar a mis tareas</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Tips organizados por categoría */}
            {Object.entries(tipsByCategory).map(([category, categoryTips]) => {
              const IconComponent = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS];
              const categoryLabel = CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS];
              const categoryColor = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS];

              return (
                <View key={category} style={styles.categorySection}>
                  <View style={styles.categoryHeader}>
                    <View style={[styles.categoryIconContainer, { backgroundColor: categoryColor + '20' }]}>
                      {IconComponent && <IconComponent size={20} color={categoryColor} />}
                    </View>
                    <Text style={styles.categoryTitle}>{categoryLabel}</Text>
                  </View>
                  
                  {categoryTips.map((tip) => (
                    <View key={tip.id} style={styles.tipCard}>
                      <View style={[styles.tipIndicator, { backgroundColor: categoryColor }]} />
                      <Text style={styles.tipText}>{tip.tip}</Text>
                    </View>
                  ))}
                </View>
              );
            })}

            {/* Mensaje final */}
            <View style={styles.footerMessage}>
              <Heart size={20} color={THEME.colors.gradient.pink} />
              <Text style={styles.footerText}>
                Estos tips están personalizados para tu estado de hoy. Recuerda que puedes actualizar cómo te sientes en cualquier momento.
              </Text>
            </View>
          </>
        ) : null}
      </ScrollView>

      <Tooltip
        visible={showTooltip}
        title="Tips personalizados"
        message="Los tips cambian según cómo te sientes hoy. Haz tu check-in diario para ver tips personalizados para tu estado emocional actual."
        onClose={() => setShowTooltip(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.fill[100],
  },
  content: {
    padding: THEME.spacing.lg,
    paddingBottom: THEME.spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: THEME.spacing.xl * 2,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: THEME.colors.fill[200],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: THEME.spacing.lg,
  },
  emptyTitle: {
    ...THEME.typography.h2,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.sm,
    textAlign: 'center',
  },
  emptyMessage: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: THEME.spacing.lg,
    paddingHorizontal: THEME.spacing.lg,
  },
  emptyAccent: {
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
  },
  emptyActionContainer: {
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    marginTop: THEME.spacing.md,
  },
  emptyActionText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    textAlign: 'center',
  },
  header: {
    marginBottom: THEME.spacing.lg,
  },
  emotionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.rounded,
    ...THEME.shadows.soft,
  },
  emotionEmoji: {
    fontSize: 48,
    marginRight: THEME.spacing.md,
  },
  emotionHeaderContent: {
    flex: 1,
  },
  emotionLabel: {
    ...THEME.typography.caption,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  emotionName: {
    ...THEME.typography.h2,
    color: THEME.colors.fill[100],
    fontFamily: THEME.fonts.heading.bold,
  },
  categorySection: {
    marginBottom: THEME.spacing.lg,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  categoryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
    borderLeftWidth: 3,
    ...THEME.shadows.soft,
  },
  tipIndicator: {
    width: 3,
    marginRight: THEME.spacing.sm,
  },
  tipText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    flex: 1,
    lineHeight: 22,
  },
  footerMessage: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    marginTop: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  footerText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    flex: 1,
    lineHeight: 20,
  },
  recommendationsSection: {
    marginBottom: THEME.spacing.lg,
  },
  recommendationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.md,
  },
  recommendationsTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  recommendationCard: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
    ...THEME.shadows.soft,
    gap: THEME.spacing.sm,
  },
  recommendationEmoji: {
    fontSize: 32,
    marginRight: THEME.spacing.xs,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    marginBottom: THEME.spacing.xs,
  },
  recommendationMessage: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
    marginBottom: THEME.spacing.sm,
  },
  suggestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    minHeight: 44,
    borderRadius: THEME.borderRadius.standard,
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.pill,
    alignSelf: 'flex-start',
  },
  suggestionButtonText: {
    ...THEME.typography.caption,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.medium,
  },
});
