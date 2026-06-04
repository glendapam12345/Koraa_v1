export type TipCategoryId = 'mindset' | 'rest' | 'action' | 'productivity';

export type TipsUserContext = {
  emotion: string;
  energyLevel: number;
  availableTime?: string;
  focusLevel?: string;
};
