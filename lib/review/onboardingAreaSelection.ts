import type { LifeAreaKey, LifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';
import { isCustomLifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';
import type { UserLifeAreasConfig } from '@/lib/lifeAreas/userLifeAreas';
import {
  BRAIN_DUMP_PRESET_CUSTOM,
  DEFAULT_HIDDEN_PRESET_AREA_REFS,
  ensureBrainDumpPresetInConfig,
  getBrainDumpColumnRefs,
} from '@/lib/review/brainDumpAreaPreset';

export type OnboardingAreaSelection = {
  ref: LifeAreaRef;
  enabled: boolean;
  name: string;
  examples: string;
};

/** Áreas que la usuaria puede elegir en onboarding. */
export function getOnboardingSelectableAreaRefs(): LifeAreaRef[] {
  return getBrainDumpColumnRefs();
}

/** Selección por defecto al omitir onboarding de áreas. */
export function getDefaultOnboardingAreaRefs(): LifeAreaRef[] {
  return getOnboardingSelectableAreaRefs();
}

export function buildAreaConfigFromOnboardingSelections(
  base: UserLifeAreasConfig,
  selections: OnboardingAreaSelection[],
): UserLifeAreasConfig {
  const seeded = ensureBrainDumpPresetInConfig(base);
  const selectable = new Set(getOnboardingSelectableAreaRefs());
  const enabledRefs: LifeAreaRef[] = [];
  const hidden = new Set<LifeAreaRef>(DEFAULT_HIDDEN_PRESET_AREA_REFS);

  const labels = { ...seeded.labels };
  const examples: Partial<Record<LifeAreaKey, string>> = { ...seeded.examples };
  const customExamples: Record<string, string> = { ...seeded.customExamples };
  let custom = seeded.custom.length ? [...seeded.custom] : [...BRAIN_DUMP_PRESET_CUSTOM];

  for (const selection of selections) {
    if (!selectable.has(selection.ref)) continue;

    const trimmedName = selection.name.trim();
    const trimmedExamples = selection.examples.trim();

    if (selection.enabled) {
      enabledRefs.push(selection.ref);
      hidden.delete(selection.ref);

      if (isCustomLifeAreaRef(selection.ref)) {
        const customId = selection.ref.slice('custom:'.length);
        if (trimmedName) {
          custom = custom.map((entry) =>
            entry.id === customId ? { ...entry, name: trimmedName } : entry,
          );
        }
        if (trimmedExamples) customExamples[customId] = trimmedExamples;
      } else {
        const key = selection.ref as LifeAreaKey;
        if (trimmedName) labels[key] = trimmedName;
        if (trimmedExamples) examples[key] = trimmedExamples;
      }
    } else {
      hidden.add(selection.ref);
    }
  }

  for (const ref of selectable) {
    if (!enabledRefs.includes(ref)) {
      hidden.add(ref);
    }
  }
  hidden.add('other');

  return {
    ...seeded,
    labels,
    examples,
    customExamples,
    custom,
    columnOrder: enabledRefs,
    hiddenAreaRefs: [...hidden],
  };
}

export function buildDefaultOnboardingAreaConfig(
  base: UserLifeAreasConfig,
): UserLifeAreasConfig {
  const defaults = getDefaultOnboardingAreaRefs();
  const selections: OnboardingAreaSelection[] = getOnboardingSelectableAreaRefs().map((ref) => ({
    ref,
    enabled: defaults.includes(ref),
    name: '',
    examples: '',
  }));
  return buildAreaConfigFromOnboardingSelections(base, selections);
}
