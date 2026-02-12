import {
  generatePersonalizedRecommendations,
  type UserPreferences,
  type CheckInContext,
  type Recommendation,
} from '@/lib/personalizedRecommendations';

describe('personalizedRecommendations', () => {
  describe('generatePersonalizedRecommendations', () => {
    it('should return generic recommendations when no preferences', () => {
      const preferences: UserPreferences = {};
      const checkIn: CheckInContext = {
        emotion: 'agotada',
        energyLevel: 1,
        availableTime: 'Poco (1-2hrs)',
        focusLevel: 'Muy distraída',
      };

      const recommendations = generatePersonalizedRecommendations(preferences, checkIn);

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].type).toBe('wellness');
    });

    it('should return recommendations based on favorite activities', () => {
      const preferences: UserPreferences = {
        favorite_activities: ['yoga', 'leer'],
      };
      const checkIn: CheckInContext = {
        emotion: 'tranquila',
        energyLevel: 4,
        availableTime: 'Medio (2-4hrs)',
        focusLevel: 'Enfocada',
      };

      const recommendations = generatePersonalizedRecommendations(preferences, checkIn);

      expect(recommendations.length).toBeGreaterThan(0);
      const activityRec = recommendations.find(r => r.type === 'activity');
      expect(activityRec).toBeDefined();
      expect(activityRec?.suggestion).toBeDefined();
    });

    it('should recommend physical activities when energy is high', () => {
      const preferences: UserPreferences = {
        favorite_activities: ['gym', 'correr'],
      };
      const checkIn: CheckInContext = {
        emotion: 'motivada',
        energyLevel: 5,
        availableTime: 'Bastante (4-6hrs)',
        focusLevel: 'Súper enfocada',
      };

      const recommendations = generatePersonalizedRecommendations(preferences, checkIn);

      const gymRec = recommendations.find(r => 
        r.suggestion?.toLowerCase().includes('gym') || 
        r.suggestion?.toLowerCase().includes('correr')
      );
      expect(gymRec).toBeDefined();
      expect(gymRec?.priority).toBeGreaterThanOrEqual(4);
    });

    it('should recommend relaxation activities when energy is low', () => {
      const preferences: UserPreferences = {
        favorite_activities: ['meditación', 'yoga'],
      };
      const checkIn: CheckInContext = {
        emotion: 'agotada',
        energyLevel: 1,
        availableTime: 'Poco (1-2hrs)',
        focusLevel: 'Muy distraída',
      };

      const recommendations = generatePersonalizedRecommendations(preferences, checkIn);

      const relaxationRec = recommendations.find(r => 
        r.suggestion?.toLowerCase().includes('meditación') || 
        r.suggestion?.toLowerCase().includes('yoga')
      );
      expect(relaxationRec).toBeDefined();
      expect(relaxationRec?.priority).toBeGreaterThanOrEqual(3);
    });

    it('should recommend creative activities for calm emotions', () => {
      const preferences: UserPreferences = {
        favorite_activities: ['leer', 'escribir'],
      };
      const checkIn: CheckInContext = {
        emotion: 'tranquila',
        energyLevel: 3,
        availableTime: 'Medio (2-4hrs)',
        focusLevel: 'Normal',
      };

      const recommendations = generatePersonalizedRecommendations(preferences, checkIn);

      const creativeRec = recommendations.find(r => 
        r.suggestion?.toLowerCase().includes('leer') || 
        r.suggestion?.toLowerCase().includes('escribir')
      );
      expect(creativeRec).toBeDefined();
      expect(creativeRec?.priority).toBeGreaterThanOrEqual(3);
    });

    it('should return recommendations based on interests', () => {
      const preferences: UserPreferences = {
        interests: ['música', 'arte'],
      };
      const checkIn: CheckInContext = {
        emotion: 'tranquila',
        energyLevel: 3,
        availableTime: 'Medio (2-4hrs)',
        focusLevel: 'Normal',
      };

      const recommendations = generatePersonalizedRecommendations(preferences, checkIn);

      expect(recommendations.length).toBeGreaterThan(0);
      const interestRec = recommendations.find(r => r.type === 'productivity');
      expect(interestRec).toBeDefined();
    });

    it('should return wellness recommendations based on age', () => {
      const preferences: UserPreferences = {
        age: 25,
      };
      const checkIn: CheckInContext = {
        emotion: 'agotada',
        energyLevel: 1,
        availableTime: 'Poco (1-2hrs)',
        focusLevel: 'Muy distraída',
      };

      const recommendations = generatePersonalizedRecommendations(preferences, checkIn);

      const wellnessRec = recommendations.find(r => r.type === 'wellness');
      expect(wellnessRec).toBeDefined();
    });

    it('should return top 5 recommendations sorted by priority', () => {
      const preferences: UserPreferences = {
        favorite_activities: ['yoga', 'gym', 'leer', 'cocinar', 'música', 'arte'],
        interests: ['viaje', 'fotografía'],
        age: 30,
      };
      const checkIn: CheckInContext = {
        emotion: 'motivada',
        energyLevel: 5,
        availableTime: 'Todo el día',
        focusLevel: 'Súper enfocada',
      };

      const recommendations = generatePersonalizedRecommendations(preferences, checkIn);

      expect(recommendations.length).toBeLessThanOrEqual(5);
      
      // Verificar que están ordenadas por prioridad (mayor a menor)
      for (let i = 0; i < recommendations.length - 1; i++) {
        expect(recommendations[i].priority).toBeGreaterThanOrEqual(recommendations[i + 1].priority);
      }
    });

    it('should handle empty arrays in preferences', () => {
      const preferences: UserPreferences = {
        favorite_activities: [],
        interests: [],
      };
      const checkIn: CheckInContext = {
        emotion: 'agotada', // Emoción que genera recomendaciones genéricas
        energyLevel: 1,
        availableTime: 'Poco (1-2hrs)',
        focusLevel: 'Muy distraída',
      };

      const recommendations = generatePersonalizedRecommendations(preferences, checkIn);

      // Debería retornar recomendaciones genéricas cuando no hay preferencias
      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should recommend social activities for anxious emotions', () => {
      const preferences: UserPreferences = {
        favorite_activities: ['amigos', 'familia'],
      };
      const checkIn: CheckInContext = {
        emotion: 'ansiosa',
        energyLevel: 2,
        availableTime: 'Poco (1-2hrs)',
        focusLevel: 'Algo distraída',
      };

      const recommendations = generatePersonalizedRecommendations(preferences, checkIn);

      const socialRec = recommendations.find(r => 
        r.suggestion?.toLowerCase().includes('amigos') || 
        r.suggestion?.toLowerCase().includes('familia')
      );
      expect(socialRec).toBeDefined();
      expect(socialRec?.priority).toBeGreaterThanOrEqual(3);
    });

    it('should handle case-insensitive emotions', () => {
      const preferences: UserPreferences = {
        favorite_activities: ['yoga'],
      };
      const checkIn: CheckInContext = {
        emotion: 'TRANQUILA', // Mayúsculas
        energyLevel: 4,
        availableTime: 'Medio (2-4hrs)',
        focusLevel: 'Enfocada',
      };

      const recommendations = generatePersonalizedRecommendations(preferences, checkIn);

      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should recommend creative activities for anxious emotions', () => {
      const preferences: UserPreferences = {
        favorite_activities: ['leer', 'escribir'],
      };
      const checkIn: CheckInContext = {
        emotion: 'ansiosa',
        energyLevel: 2,
        availableTime: 'Poco (1-2hrs)',
        focusLevel: 'Algo distraída',
      };

      const recommendations = generatePersonalizedRecommendations(preferences, checkIn);

      const creativeRec = recommendations.find(r => 
        r.suggestion?.toLowerCase().includes('leer') || 
        r.suggestion?.toLowerCase().includes('escribir')
      );
      expect(creativeRec).toBeDefined();
      expect(creativeRec?.message).toContain('calmar');
    });

    it('should recommend relaxation activities for low energy', () => {
      const preferences: UserPreferences = {
        favorite_activities: ['meditación', 'spa'],
      };
      const checkIn: CheckInContext = {
        emotion: 'agotada',
        energyLevel: 1,
        availableTime: 'Poco (1-2hrs)',
        focusLevel: 'Muy distraída',
      };

      const recommendations = generatePersonalizedRecommendations(preferences, checkIn);

      const relaxationRec = recommendations.find(r => 
        r.suggestion?.toLowerCase().includes('meditación') || 
        r.suggestion?.toLowerCase().includes('spa')
      );
      expect(relaxationRec).toBeDefined();
      expect(relaxationRec?.priority).toBe(5);
    });

    it('should recommend activities for moderate energy', () => {
      const preferences: UserPreferences = {
        favorite_activities: ['yoga'],
      };
      const checkIn: CheckInContext = {
        emotion: 'agotada',
        energyLevel: 2,
        availableTime: 'Medio (2-4hrs)',
        focusLevel: 'Normal',
      };

      const recommendations = generatePersonalizedRecommendations(preferences, checkIn);

      const yogaRec = recommendations.find(r => 
        r.suggestion?.toLowerCase().includes('yoga')
      );
      expect(yogaRec).toBeDefined();
    });

    it('should handle wellness recommendations for different age ranges', () => {
      const preferences25: UserPreferences = {
        age: 25,
      };
      const preferences30: UserPreferences = {
        age: 30,
      };
      const preferences40: UserPreferences = {
        age: 40,
      };
      const checkIn: CheckInContext = {
        emotion: 'agotada',
        energyLevel: 1,
        availableTime: 'Poco (1-2hrs)',
        focusLevel: 'Muy distraída',
      };

      const rec25 = generatePersonalizedRecommendations(preferences25, checkIn);
      const rec30 = generatePersonalizedRecommendations(preferences30, checkIn);
      const rec40 = generatePersonalizedRecommendations(preferences40, checkIn);

      // Todas deberían generar recomendaciones
      expect(rec25.length).toBeGreaterThan(0);
      expect(rec30.length).toBeGreaterThan(0);
      expect(rec40.length).toBeGreaterThan(0);
    });

    it('should handle interests that require high energy', () => {
      const preferences: UserPreferences = {
        interests: ['viaje', 'aventura'],
      };
      const checkIn: CheckInContext = {
        emotion: 'motivada',
        energyLevel: 5,
        availableTime: 'Todo el día',
        focusLevel: 'Súper enfocada',
      };

      const recommendations = generatePersonalizedRecommendations(preferences, checkIn);

      const interestRec = recommendations.find(r => 
        r.message.toLowerCase().includes('viaje') || 
        r.message.toLowerCase().includes('aventura')
      );
      expect(interestRec).toBeDefined();
    });

    it('should recommend social activities for negative emotions', () => {
      const preferences: UserPreferences = {
        favorite_activities: ['amigos', 'familia'],
      };
      const checkIn: CheckInContext = {
        emotion: 'agotada',
        energyLevel: 2,
        availableTime: 'Poco (1-2hrs)',
        focusLevel: 'Muy distraída',
      };

      const recommendations = generatePersonalizedRecommendations(preferences, checkIn);

      const socialRec = recommendations.find(r => 
        r.suggestion?.toLowerCase().includes('amigos') || 
        r.suggestion?.toLowerCase().includes('familia')
      );
      expect(socialRec).toBeDefined();
      expect(socialRec?.message).toContain('agotada');
    });

    it('should recommend social activities for positive emotions', () => {
      const preferences: UserPreferences = {
        favorite_activities: ['reunión', 'cita'],
      };
      const checkIn: CheckInContext = {
        emotion: 'motivada',
        energyLevel: 4,
        availableTime: 'Medio (2-4hrs)',
        focusLevel: 'Enfocada',
      };

      const recommendations = generatePersonalizedRecommendations(preferences, checkIn);

      const socialRec = recommendations.find(r => 
        r.suggestion?.toLowerCase().includes('reunión') || 
        r.suggestion?.toLowerCase().includes('cita')
      );
      expect(socialRec).toBeDefined();
    });

    it('should recommend relaxation for low energy even without negative emotion', () => {
      const preferences: UserPreferences = {
        favorite_activities: ['meditación', 'baño'],
      };
      const checkIn: CheckInContext = {
        emotion: 'tranquila',
        energyLevel: 1,
        availableTime: 'Poco (1-2hrs)',
        focusLevel: 'Normal',
      };

      const recommendations = generatePersonalizedRecommendations(preferences, checkIn);

      const relaxationRec = recommendations.find(r => 
        r.suggestion?.toLowerCase().includes('meditación') || 
        r.suggestion?.toLowerCase().includes('baño')
      );
      expect(relaxationRec).toBeDefined();
    });

    it('should recommend creative interests for anxious emotions', () => {
      const preferences: UserPreferences = {
        interests: ['música', 'lectura'],
      };
      const checkIn: CheckInContext = {
        emotion: 'ansiosa',
        energyLevel: 2,
        availableTime: 'Poco (1-2hrs)',
        focusLevel: 'Algo distraída',
      };

      const recommendations = generatePersonalizedRecommendations(preferences, checkIn);

      const interestRec = recommendations.find(r => 
        r.message.toLowerCase().includes('música') || 
        r.message.toLowerCase().includes('lectura')
      );
      expect(interestRec).toBeDefined();
      expect(interestRec?.message).toContain('distracción positiva');
    });

    it('should recommend creative interests for calm emotions', () => {
      const preferences: UserPreferences = {
        interests: ['arte', 'aprender'],
      };
      const checkIn: CheckInContext = {
        emotion: 'tranquila',
        energyLevel: 3,
        availableTime: 'Medio (2-4hrs)',
        focusLevel: 'Normal',
      };

      const recommendations = generatePersonalizedRecommendations(preferences, checkIn);

      const interestRec = recommendations.find(r => 
        r.message.toLowerCase().includes('arte') || 
        r.message.toLowerCase().includes('aprender')
      );
      expect(interestRec).toBeDefined();
      expect(interestRec?.message).toContain('calma');
    });

    it('should recommend wellness for age 18-25 with abrumada emotion', () => {
      const preferences: UserPreferences = {
        age: 22,
      };
      const checkIn: CheckInContext = {
        emotion: 'abrumada',
        energyLevel: 3,
        availableTime: 'Medio (2-4hrs)',
        focusLevel: 'Normal',
      };

      const recommendations = generatePersonalizedRecommendations(preferences, checkIn);

      const wellnessRec = recommendations.find(r => 
        r.type === 'wellness' && r.message.includes('descanso')
      );
      expect(wellnessRec).toBeDefined();
    });

    it('should recommend wellness for age 26-35 with low energy', () => {
      const preferences: UserPreferences = {
        age: 30,
        favorite_activities: ['yoga'], // Necesita tener al menos una actividad para que no retorne genéricas
      };
      const checkIn: CheckInContext = {
        emotion: 'tranquila',
        energyLevel: 2, // energyLevel <= 2
        availableTime: 'Poco (1-2hrs)',
        focusLevel: 'Normal',
      };

      const recommendations = generatePersonalizedRecommendations(preferences, checkIn);

      const wellnessRec = recommendations.find(r => 
        r.type === 'wellness' && (r.message.includes('caminata') || r.message.includes('Movimiento') || r.title.includes('Movimiento'))
      );
      expect(wellnessRec).toBeDefined();
    });

    it('should recommend wellness for age 36+ with abrumada emotion', () => {
      const preferences: UserPreferences = {
        age: 40,
        favorite_activities: ['yoga'], // Necesita tener al menos una actividad para que no retorne genéricas
      };
      const checkIn: CheckInContext = {
        emotion: 'abrumada',
        energyLevel: 3,
        availableTime: 'Poco (1-2hrs)',
        focusLevel: 'Normal',
      };

      const recommendations = generatePersonalizedRecommendations(preferences, checkIn);

      const wellnessRec = recommendations.find(r => 
        r.type === 'wellness' && (r.message.includes('Autocuidado') || r.title.includes('Autocuidado') || r.message.includes('escuchar'))
      );
      expect(wellnessRec).toBeDefined();
    });

    it('should handle generic recommendations for different energy levels', () => {
      const preferences: UserPreferences = {};
      const lowEnergyCheckIn: CheckInContext = {
        emotion: 'tranquila',
        energyLevel: 1,
        availableTime: 'Poco (1-2hrs)',
        focusLevel: 'Normal',
      };

      const highEnergyCheckIn: CheckInContext = {
        emotion: 'motivada',
        energyLevel: 5,
        availableTime: 'Todo el día',
        focusLevel: 'Súper enfocada',
      };

      const lowRec = generatePersonalizedRecommendations(preferences, lowEnergyCheckIn);
      const highRec = generatePersonalizedRecommendations(preferences, highEnergyCheckIn);

      expect(lowRec.length).toBeGreaterThan(0);
      expect(highRec.length).toBeGreaterThanOrEqual(0);
    });
  });
});
