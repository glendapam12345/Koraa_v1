import type { LifeAreaKey } from '@/lib/lifeAreas/lifeAreaCatalog';
import { lifeAreaCatalogEntry } from '@/lib/lifeAreas/lifeAreaCatalog';
import {
  BRAIN_DUMP_PRESET_CUSTOM,
  BRAIN_DUMP_PRESET_LABELS,
  isBrainDumpPresetCustomId,
} from '@/lib/review/brainDumpAreaPreset';

/** Nombres guardados al sembrar cuentas en español — no son personalizaciones de la usuaria. */
const PRESET_BUILTIN_LABELS_ES: Partial<Record<LifeAreaKey, string[]>> = {
  home: ['Hogar', 'Casa y vida'],
  work: ['Trabajo'],
  other: ['Otros', 'Otro'],
};

function isPresetBuiltinLabel(ref: LifeAreaKey, label: string): boolean {
  const trimmed = label.trim();
  if (!trimmed) return false;
  const preset = BRAIN_DUMP_PRESET_LABELS[ref];
  const catalog = lifeAreaCatalogEntry(ref).name;
  const known = PRESET_BUILTIN_LABELS_ES[ref] ?? [];
  return (
    trimmed === preset ||
    trimmed === catalog ||
    known.includes(trimmed)
  );
}

export function resolveBuiltinAreaDisplayName(
  ref: LifeAreaKey,
  storedLabel: string | undefined,
  getDefaultLabel?: (key: LifeAreaKey) => string,
): string {
  const trimmed = storedLabel?.trim();
  if (trimmed && !isPresetBuiltinLabel(ref, trimmed)) {
    return trimmed;
  }
  return getDefaultLabel?.(ref) ?? lifeAreaCatalogEntry(ref).name;
}

export function resolveCustomAreaDisplayName(
  customId: string,
  storedName: string | undefined,
  translatePresetCustom?: (presetCustomId: string) => string,
): string {
  const trimmed = storedName?.trim() ?? '';
  if (isBrainDumpPresetCustomId(customId)) {
    const presetDefault = BRAIN_DUMP_PRESET_CUSTOM.find((entry) => entry.id === customId)?.name?.trim();
    if (!trimmed || (presetDefault && trimmed === presetDefault)) {
      return translatePresetCustom?.(customId) ?? trimmed ?? presetDefault ?? '';
    }
  }
  return trimmed;
}
