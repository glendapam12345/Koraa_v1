import { detectCategory } from '@/lib/categoryDetection';
import { makeCustomLifeAreaRef, type LifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';
import {
  inferLifeAreaFromUserExamples,
  resolveActiveLifeAreaRef,
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
  let ref: LifeAreaRef;

  if (config) {
    const fromExamples = inferLifeAreaFromUserExamples(content, config);
    if (fromExamples) {
      return resolveActiveLifeAreaRef(fromExamples, config);
    }
  }
  if (textHits(content, EXERCISE_KEYWORDS)) ref = 'health';
  else if (textHits(content, FAMILY_KEYWORDS)) {
    ref = makeCustomLifeAreaRef(BRAIN_DUMP_PRESET_CUSTOM_IDS.personal);
  } else {
    const hint = inferGroupContextHint([{ content }]);
    if (hint === 'health') ref = 'health';
    else if (hint === 'work') ref = 'work';
    else if (hint === 'home') ref = 'home';
    else if (hint === 'personal') {
      ref = makeCustomLifeAreaRef(BRAIN_DUMP_PRESET_CUSTOM_IDS.personal);
    } else if (hint === 'venture') ref = 'work';
    else {
      const category = detectCategory(content);
      if (category === 'salud') ref = 'health';
      else if (category === 'trabajo') ref = 'work';
      else if (category === 'personal') {
        ref = makeCustomLifeAreaRef(BRAIN_DUMP_PRESET_CUSTOM_IDS.personal);
      } else ref = 'other';
    }
  }

  return config ? resolveActiveLifeAreaRef(ref, config) : ref;
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
