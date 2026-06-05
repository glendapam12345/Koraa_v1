import { useMemo, useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import {
  buildHoyEmotionalClosure,
  buildHoyEmotionalToneLine,
} from '@/lib/hoyEmotionalClosure';
import type { Task } from '@/components/tasks/TaskCard';
import type { EmotionalMemoryInsight } from '@/lib/hoyEmotionalMemory';

type UseHoyEmotionalContentOptions = {
  todayMood: string | null;
  energyLevel: number;
  tasks: Task[];
  emotionalMemoryInsights: EmotionalMemoryInsight[];
  t: (key: string, params?: Record<string, string | number>) => string;
};

export function useHoyEmotionalContent({
  todayMood,
  energyLevel,
  tasks,
  emotionalMemoryInsights,
  t,
}: UseHoyEmotionalContentOptions) {
  const emotionalCardsAnim = useRef(new Animated.Value(0)).current;

  const emotionalClosure = useMemo(
    () => buildHoyEmotionalClosure({ todayMood, energyLevel, tasks, t }),
    [todayMood, energyLevel, tasks, t],
  );

  const emotionalToneLine = useMemo(
    () => buildHoyEmotionalToneLine(todayMood, t),
    [todayMood, t],
  );

  const selectedEmotionalMemoryInsight = useMemo(() => {
    if (emotionalMemoryInsights.length === 0) return null;
    const dayIndex = new Date().getDate() % emotionalMemoryInsights.length;
    return emotionalMemoryInsights[dayIndex];
  }, [emotionalMemoryInsights]);

  useEffect(() => {
    emotionalCardsAnim.setValue(0);
    Animated.timing(emotionalCardsAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [emotionalClosure, selectedEmotionalMemoryInsight, emotionalCardsAnim]);

  return {
    emotionalClosure,
    emotionalToneLine,
    selectedEmotionalMemoryInsight,
    emotionalCardsAnim,
  };
}
