import {
  makeCustomLifeAreaRef,
  type LifeAreaKey,
  type LifeAreaRef,
} from '@/lib/lifeAreas/lifeAreaCatalog';
import type { CustomLifeArea, UserLifeAreasConfig } from '@/lib/lifeAreas/userLifeAreas';

export const BRAIN_DUMP_PRESET_CUSTOM_IDS = {
  familia: 'bd_familia',
  personal: 'bd_personal',
} as const;

export const BRAIN_DUMP_PRESET_CUSTOM: CustomLifeArea[] = [
  { id: BRAIN_DUMP_PRESET_CUSTOM_IDS.familia, name: 'Familia', emoji: '👨‍👩‍👧' },
  { id: BRAIN_DUMP_PRESET_CUSTOM_IDS.personal, name: 'Personal', emoji: '🌸' },
];

export const BRAIN_DUMP_PRESET_LABELS: Partial<Record<LifeAreaKey, string>> = {
  health: 'Ejercicio',
  home: 'Hogar',
  work: 'Trabajo',
  other: 'Extras',
};

const PRESET_CUSTOM_ID_SET = new Set<string>(Object.values(BRAIN_DUMP_PRESET_CUSTOM_IDS));

/** Columnas fijas del tablero de revisión (sin sueltas ni áreas extra). */
export function getBrainDumpColumnRefs(): LifeAreaRef[] {
  return [
    'health',
    'home',
    makeCustomLifeAreaRef(BRAIN_DUMP_PRESET_CUSTOM_IDS.familia),
    makeCustomLifeAreaRef(BRAIN_DUMP_PRESET_CUSTOM_IDS.personal),
    'work',
    'other',
  ];
}

export function isBrainDumpPresetCustomId(id: string): boolean {
  return PRESET_CUSTOM_ID_SET.has(id);
}

/** Asegura áreas preset en preferencias del usuario (sin pisar nombres ya personalizados). */
export function ensureBrainDumpPresetInConfig(config: UserLifeAreasConfig): UserLifeAreasConfig {
  const labels = { ...config.labels };
  for (const [key, label] of Object.entries(BRAIN_DUMP_PRESET_LABELS)) {
    const areaKey = key as LifeAreaKey;
    if (!labels[areaKey]) {
      labels[areaKey] = label;
    }
  }

  const custom = [...config.custom];
  for (const preset of BRAIN_DUMP_PRESET_CUSTOM) {
    if (!custom.some((entry) => entry.id === preset.id)) {
      custom.push({ ...preset });
    }
  }

  return { labels, custom };
}

export function brainDumpPresetConfigChanged(
  before: UserLifeAreasConfig,
  after: UserLifeAreasConfig,
): boolean {
  return JSON.stringify(before) !== JSON.stringify(after);
}
