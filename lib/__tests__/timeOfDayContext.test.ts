import {
  getTimeOfDayPeriod,
  getTimeOfDayGreetingKey,
  getTimeOfDayChipKey,
  isLateNight,
  isNighttime,
} from '@/lib/timeOfDayContext';

describe('timeOfDayContext', () => {
  describe('getTimeOfDayPeriod', () => {
    it('returns morning for 5–11', () => {
      expect(getTimeOfDayPeriod(5)).toBe('morning');
      expect(getTimeOfDayPeriod(11)).toBe('morning');
    });

    it('returns afternoon for 12–17', () => {
      expect(getTimeOfDayPeriod(12)).toBe('afternoon');
      expect(getTimeOfDayPeriod(17)).toBe('afternoon');
    });

    it('returns evening for 18–21', () => {
      expect(getTimeOfDayPeriod(18)).toBe('evening');
      expect(getTimeOfDayPeriod(21)).toBe('evening');
    });

    it('returns night for 22–4', () => {
      expect(getTimeOfDayPeriod(22)).toBe('night');
      expect(getTimeOfDayPeriod(23)).toBe('night');
      expect(getTimeOfDayPeriod(0)).toBe('night');
      expect(getTimeOfDayPeriod(4)).toBe('night');
    });
  });

  describe('isLateNight', () => {
    it('is true from 22:00 through 04:59', () => {
      expect(isLateNight(22)).toBe(true);
      expect(isLateNight(3)).toBe(true);
      expect(isLateNight(4)).toBe(true);
    });

    it('is false during daytime hours', () => {
      expect(isLateNight(5)).toBe(false);
      expect(isLateNight(12)).toBe(false);
      expect(isLateNight(21)).toBe(false);
    });
  });

  describe('isNighttime', () => {
    it('covers evening through early morning', () => {
      expect(isNighttime(18)).toBe(true);
      expect(isNighttime(23)).toBe(true);
      expect(isNighttime(5)).toBe(true);
      expect(isNighttime(17)).toBe(false);
    });
  });

  describe('i18n keys', () => {
    it('maps periods to greeting and chip keys', () => {
      expect(getTimeOfDayGreetingKey('morning')).toBe('hoy.greetingMorning');
      expect(getTimeOfDayGreetingKey('night')).toBe('hoy.greetingNight');
      expect(getTimeOfDayChipKey('evening')).toBe('hoy.timeChipEvening');
      expect(getTimeOfDayChipKey('night')).toBe('hoy.timeChipNight');
    });
  });
});
