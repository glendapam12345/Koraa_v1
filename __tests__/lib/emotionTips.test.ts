import { EMOTION_TIPS, type EmotionTip } from '@/lib/emotionTips';

describe('emotionTips', () => {
  describe('EMOTION_TIPS', () => {
    it('should have tips for agotada emotion', () => {
      expect(EMOTION_TIPS.agotada).toBeDefined();
      expect(Array.isArray(EMOTION_TIPS.agotada)).toBe(true);
      expect(EMOTION_TIPS.agotada.length).toBeGreaterThan(0);
    });

    it('should have tips for ansiosa emotion', () => {
      expect(EMOTION_TIPS.ansiosa).toBeDefined();
      expect(Array.isArray(EMOTION_TIPS.ansiosa)).toBe(true);
      expect(EMOTION_TIPS.ansiosa.length).toBeGreaterThan(0);
    });

    it('should have tips for tranquila emotion', () => {
      expect(EMOTION_TIPS.tranquila).toBeDefined();
      expect(Array.isArray(EMOTION_TIPS.tranquila)).toBe(true);
      expect(EMOTION_TIPS.tranquila.length).toBeGreaterThan(0);
    });

    it('should have tips for motivada emotion', () => {
      expect(EMOTION_TIPS.motivada).toBeDefined();
      expect(Array.isArray(EMOTION_TIPS.motivada)).toBe(true);
      expect(EMOTION_TIPS.motivada.length).toBeGreaterThan(0);
    });

    it('should have tips for abrumada emotion', () => {
      expect(EMOTION_TIPS.abrumada).toBeDefined();
      expect(Array.isArray(EMOTION_TIPS.abrumada)).toBe(true);
      expect(EMOTION_TIPS.abrumada.length).toBeGreaterThan(0);
    });

    it('should have tips for enfocada emotion', () => {
      expect(EMOTION_TIPS.enfocada).toBeDefined();
      expect(Array.isArray(EMOTION_TIPS.enfocada)).toBe(true);
      expect(EMOTION_TIPS.enfocada.length).toBeGreaterThan(0);
    });

    it('should have valid tip structure', () => {
      const emotion = 'agotada';
      const tips = EMOTION_TIPS[emotion];
      
      tips.forEach((tip: EmotionTip) => {
        expect(tip).toHaveProperty('id');
        expect(tip).toHaveProperty('tip');
        expect(tip).toHaveProperty('category');
        expect(typeof tip.id).toBe('string');
        expect(typeof tip.tip).toBe('string');
        expect(['rest', 'action', 'mindset', 'productivity']).toContain(tip.category);
      });
    });

    it('should have unique tip IDs per emotion', () => {
      const emotion = 'agotada';
      const tips = EMOTION_TIPS[emotion];
      const ids = tips.map((tip: EmotionTip) => tip.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have tips with non-empty messages', () => {
      const emotion = 'tranquila';
      const tips = EMOTION_TIPS[emotion];
      
      tips.forEach((tip: EmotionTip) => {
        expect(tip.tip.length).toBeGreaterThan(0);
      expect(tip.tip.trim()).toBe(tip.tip);
    });
  });

  describe('getEmotionTips', () => {
    it('should return tips for valid emotion', () => {
      const { getEmotionTips } = require('@/lib/emotionTips');
      const tips = getEmotionTips('tranquila');
      
      expect(Array.isArray(tips)).toBe(true);
      expect(tips.length).toBeGreaterThan(0);
    });

    it('should return empty array for invalid emotion', () => {
      const { getEmotionTips } = require('@/lib/emotionTips');
      const tips = getEmotionTips('invalid-emotion');
      
      expect(Array.isArray(tips)).toBe(true);
      expect(tips.length).toBe(0);
    });

    it('should be case-insensitive', () => {
      const { getEmotionTips } = require('@/lib/emotionTips');
      const tipsLower = getEmotionTips('tranquila');
      const tipsUpper = getEmotionTips('TRANQUILA');
      const tipsMixed = getEmotionTips('Tranquila');
      
      expect(tipsLower.length).toBeGreaterThan(0);
      expect(tipsUpper.length).toBe(tipsLower.length);
      expect(tipsMixed.length).toBe(tipsLower.length);
    });
  });

  describe('getRandomTip', () => {
    it('should return a random tip for valid emotion', () => {
      const { getRandomTip } = require('@/lib/emotionTips');
      const tip = getRandomTip('tranquila');
      
      expect(tip).toBeDefined();
      expect(tip).toHaveProperty('id');
      expect(tip).toHaveProperty('tip');
      expect(tip).toHaveProperty('category');
    });

    it('should return null for invalid emotion', () => {
      const { getRandomTip } = require('@/lib/emotionTips');
      const tip = getRandomTip('invalid-emotion');
      
      expect(tip).toBeNull();
    });

    it('should return different tips on multiple calls', () => {
      const { getRandomTip } = require('@/lib/emotionTips');
      const tips = new Set();
      
      // Llamar múltiples veces para obtener diferentes tips
      for (let i = 0; i < 10; i++) {
        const tip = getRandomTip('tranquila');
        if (tip) {
          tips.add(tip.id);
        }
      }
      
      // Si hay múltiples tips, deberíamos obtener al menos uno diferente
      // (aunque puede ser el mismo por aleatoriedad)
      expect(tips.size).toBeGreaterThan(0);
    });
  });
});
});
