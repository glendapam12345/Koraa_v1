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
  });
});
