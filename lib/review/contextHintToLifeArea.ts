import type { LifeAreaKey } from '@/lib/lifeAreas/lifeAreaCatalog';
import type { GroupContextHint } from '@/lib/review/inferGroupContextHint';

/** Área de vida sugerida a partir del hint de contexto del grupo. */
export function contextHintToLifeAreaKey(hint: GroupContextHint): LifeAreaKey {
  switch (hint) {
    case 'work':
      return 'work';
    case 'home':
      return 'home';
    case 'venture':
      return 'creative';
    case 'personal':
      return 'home';
    case 'health':
      return 'health';
    default:
      return 'other';
  }
}
