import type { RefObject } from 'react';
import type { ScrollView, View } from 'react-native';

export function scrollChildIntoView(
  scrollRef: RefObject<ScrollView | null>,
  contentRef: RefObject<View | null>,
  targetRef: View,
  offsetTop = 24,
): void {
  const content = contentRef.current;
  const scroll = scrollRef.current;
  if (!content || !scroll) return;

  targetRef.measureLayout(
    content,
    (_x, y) => {
      scroll.scrollTo({ y: Math.max(0, y - offsetTop), animated: true });
    },
    () => {
      /* layout not ready yet */
    },
  );
}
