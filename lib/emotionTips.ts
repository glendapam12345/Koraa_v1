import type { TipCategoryId } from '@/lib/tipsTypes';

export type EmotionTip = {
  id: string;
  tip: string;
  category: TipCategoryId;
};
