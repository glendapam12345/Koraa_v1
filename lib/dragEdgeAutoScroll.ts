import { Dimensions } from 'react-native';
import type { ScrollView } from 'react-native';

const DEFAULT_EDGE = 88;
const DEFAULT_STEP = 18;
const TOP_INSET = 140;

export type DragEdgeAutoScrollOptions = {
  edge?: number;
  step?: number;
  topInset?: number;
};

/** Scrolls parent when drag finger nears screen edges; returns updated scroll offset. */
export function applyDragEdgeAutoScroll(
  scrollRef: ScrollView | null | undefined,
  scrollY: number,
  absoluteY: number,
  options?: DragEdgeAutoScrollOptions,
): number {
  if (!scrollRef) return scrollY;

  const edge = options?.edge ?? DEFAULT_EDGE;
  const step = options?.step ?? DEFAULT_STEP;
  const topInset = options?.topInset ?? TOP_INSET;
  const { height } = Dimensions.get('window');

  let nextY = scrollY;
  if (absoluteY > height - edge) {
    nextY += step;
  } else if (absoluteY < topInset) {
    nextY = Math.max(0, scrollY - step);
  }

  if (nextY !== scrollY) {
    scrollRef.scrollTo({ y: nextY, animated: false });
  }
  return nextY;
}
