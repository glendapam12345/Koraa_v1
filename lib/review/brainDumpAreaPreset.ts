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

/** Tres áreas base en captura y onboarding (hogar / personal / trabajo). */
export const BRAIN_DUMP_PRESET_LABELS: Partial<Record<LifeAreaKey, string>> = {
  home: 'Hogar',
  work: 'Trabajo',
  other: 'Otros',
};

/** Preset legacy: ocultas por defecto en cuentas nuevas; siguen en datos si ya existían. */
export const DEFAULT_HIDDEN_PRESET_AREA_REFS: LifeAreaRef[] = [
  'health',
  'other',
  makeCustomLifeAreaRef(BRAIN_DUMP_PRESET_CUSTOM_IDS.familia),
];

const PRESET_CUSTOM_ID_SET = new Set<string>(Object.values(BRAIN_DUMP_PRESET_CUSTOM_IDS));

/** Columnas fijas del tablero de revisión (sin sueltas ni áreas extra). */
export function getBrainDumpColumnRefs(): LifeAreaRef[] {
  return [
    'home',
    makeCustomLifeAreaRef(BRAIN_DUMP_PRESET_CUSTOM_IDS.personal),
    'work',
  ];
}

export function isBrainDumpPresetCustomId(id: string): boolean {
  return PRESET_CUSTOM_ID_SET.has(id);
}

/** Asegura áreas preset en preferencias del usuario (sin pisar nombres ya personalizados). */
export function ensureBrainDumpPresetInConfig(config: UserLifeAreasConfig): UserLifeAreasConfig {
  const custom = [...config.custom];
  for (const preset of BRAIN_DUMP_PRESET_CUSTOM) {
    if (!custom.some((entry) => entry.id === preset.id)) {
      custom.push({ ...preset });
    }
  }

  const isFresh =
    !config.hiddenAreaRefs?.length &&
    Object.keys(config.labels).length === 0 &&
    !config.columnOrder?.length &&
    config.custom.length === 0;

  return {
    ...config,
    custom,
    ...(config.hiddenAreaRefs == null && isFresh
      ? { hiddenAreaRefs: [...DEFAULT_HIDDEN_PRESET_AREA_REFS] }
      : {}),
  };
}

export function brainDumpPresetConfigChanged(
  before: UserLifeAreasConfig,
  after: UserLifeAreasConfig,
): boolean {
  return JSON.stringify(before) !== JSON.stringify(after);
}
