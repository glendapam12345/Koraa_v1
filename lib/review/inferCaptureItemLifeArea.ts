import { detectCategory } from '@/lib/categoryDetection';
import { makeCustomLifeAreaRef, type LifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';
import {
  inferLifeAreaFromUserExamples,
  type UserLifeAreasConfig,
} from '@/lib/lifeAreas/userLifeAreas';
import { BRAIN_DUMP_PRESET_CUSTOM_IDS } from '@/lib/review/brainDumpAreaPreset';
import { inferGroupContextHint } from '@/lib/review/inferGroupContextHint';
import type { EnrichedCaptureItem } from '@/lib/taskIntelligentEnrichment';

const FAMILY_KEYWORDS = [
  'familia',
  'family',
  'hijo',
  'hija',
  'papá',
  'papa',
  'mamá',
  'mama',
  'padres',
  'esposo',
  'esposa',
  'pareja',
  'abuel',
  'nieto',
];

const EXERCISE_KEYWORDS = [
  'ejercicio',
  'gym',
  'correr',
  'yoga',
  'entrenar',
  'workout',
  'caminar',
  'pesas',
  'natación',
  'nadar',
  'pilates',
];

function textHits(content: string, keywords: string[]): boolean {
  const lower = content.toLowerCase();
  return keywords.some((keyword) => lower.includes(keyword));
}

/** Sugiere área de vida para una tarea capturada (preset del brain dump). */
export function inferCaptureItemLifeArea(
  content: string,
  config?: UserLifeAreasConfig,
): LifeAreaRef {
  if (config) {
    const fromExamples = inferLifeAreaFromUserExamples(content, config);
    if (fromExamples) return fromExamples;
  }
  if (textHits(content, EXERCISE_KEYWORDS)) return 'health';
  if (textHits(content, FAMILY_KEYWORDS)) {
    return makeCustomLifeAreaRef(BRAIN_DUMP_PRESET_CUSTOM_IDS.familia);
  }

  const hint = inferGroupContextHint([{ content }]);
  if (hint === 'health') return 'health';
  if (hint === 'work') return 'work';
  if (hint === 'home') return 'home';
  if (hint === 'personal') return makeCustomLifeAreaRef(BRAIN_DUMP_PRESET_CUSTOM_IDS.personal);
  if (hint === 'venture') return 'work';

  const category = detectCategory(content);
  if (category === 'salud') return 'health';
  if (category === 'trabajo') return 'work';
  if (category === 'personal') {
    return makeCustomLifeAreaRef(BRAIN_DUMP_PRESET_CUSTOM_IDS.personal);
  }

  return 'other';
}

export function applyInferredLifeAreas(
  items: EnrichedCaptureItem[],
  config?: UserLifeAreasConfig,
): EnrichedCaptureItem[] {
  return items.map((item) => {
    if (item.lifeAreaKey != null) return item;
    return { ...item, lifeAreaKey: inferCaptureItemLifeArea(item.content, config) };
  });
}
