import { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { TranslationKey } from '@/lib/i18n';
import type { EllieMood } from '@/lib/elliePersonality';
import { OnboardingEllieCoach } from '@/components/onboarding/OnboardingEllieCoach';
import {
  OnboardingFlowMockPreview,
  type OnboardingFlowMockVariant,
} from '@/components/onboarding/OnboardingFlowMockPreview';
import { OnboardingProgressDots } from '@/components/onboarding/OnboardingProgressDots';

type TourSlide = {
  id: string;
  mood: EllieMood;
  messageKey: TranslationKey;
  kickerKey: TranslationKey;
  bodyKey: TranslationKey;
  mock: OnboardingFlowMockVariant;
};

const SLIDES: TourSlide[] = [
  {
    id: 'capture',
    mood: 'happy',
    messageKey: 'onboarding.tour.ellie.step1',
    kickerKey: 'onboarding.tour.step1Kicker',
    bodyKey: 'onboarding.tour.step1Body',
    mock: 'capture',
  },
  {
    id: 'feel',
    mood: 'breathing',
    messageKey: 'onboarding.tour.ellie.step2',
    kickerKey: 'onboarding.tour.step2Kicker',
    bodyKey: 'onboarding.tour.step2Body',
    mock: 'feel',
  },
  {
    id: 'hoy',
    mood: 'grateful',
    messageKey: 'onboarding.tour.ellie.step3',
    kickerKey: 'onboarding.tour.step3Kicker',
    bodyKey: 'onboarding.tour.step3Body',
    mock: 'hoy',
  },
];

type OnboardingEllieFlowDemoProps = {
  onReachEnd?: () => void;
};

/**
 * Muestra interactiva del flujo Koraa con Ellie — swipe entre pasos.
 */
export function OnboardingEllieFlowDemo({ onReachEnd }: OnboardingEllieFlowDemoProps) {
  const { t } = useI18n();
  const { width: windowWidth } = useWindowDimensions();
  const slideWidth = windowWidth - THEME.layout.screenPaddingX * 2;
  const listRef = useRef<FlatList<TourSlide>>(null);
  const [index, setIndex] = useState(0);

  const activeSlide = SLIDES[index] ?? SLIDES[0];

  const goTo = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(SLIDES.length - 1, next));
      setIndex(clamped);
      listRef.current?.scrollToIndex({ index: clamped, animated: true });
      if (clamped === SLIDES.length - 1) onReachEnd?.();
    },
    [onReachEnd],
  );

  const onScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.round(event.nativeEvent.contentOffset.x / slideWidth);
      if (next !== index) {
        setIndex(next);
        if (next === SLIDES.length - 1) onReachEnd?.();
      }
    },
    [index, onReachEnd, slideWidth],
  );

  return (
    <View style={styles.wrap}>
      <OnboardingEllieCoach
        message={t(activeSlide.messageKey)}
        mood={activeSlide.mood}
        size={64}
        withBottomGap={false}
      />

      <OnboardingProgressDots
        total={SLIDES.length}
        current={index + 1}
        accessibilityLabel={t('onboarding.tour.progressA11y', {
          current: index + 1,
          total: SLIDES.length,
        })}
      />

      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        snapToInterval={slideWidth}
        decelerationRate="fast"
        disableIntervalMomentum
        onMomentumScrollEnd={onScrollEnd}
        onScrollToIndexFailed={(info) => {
          listRef.current?.scrollToOffset({
            offset: info.index * slideWidth,
            animated: true,
          });
        }}
        getItemLayout={(_, itemIndex) => ({
          length: slideWidth,
          offset: slideWidth * itemIndex,
          index: itemIndex,
        })}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: slideWidth }]}>
            <Text style={styles.kicker}>{t(item.kickerKey)}</Text>
            <OnboardingFlowMockPreview variant={item.mock} />
            <Text style={styles.body}>{t(item.bodyKey)}</Text>
          </View>
        )}
      />

      <View style={styles.navRow}>
        <TouchableOpacity
          onPress={() => goTo(index - 1)}
          disabled={index === 0}
          style={[styles.navBtn, index === 0 && styles.navBtnDisabled]}
          accessibilityRole="button"
          accessibilityLabel={t('onboarding.tour.prevA11y')}
          accessibilityState={{ disabled: index === 0 }}
        >
          <ChevronLeft size={20} color={THEME.colors.calm.lavenderDeep} />
        </TouchableOpacity>
        <Text style={styles.navHint}>{t('onboarding.tour.swipeHint')}</Text>
        <TouchableOpacity
          onPress={() => goTo(index + 1)}
          disabled={index >= SLIDES.length - 1}
          style={[styles.navBtn, index >= SLIDES.length - 1 && styles.navBtnDisabled]}
          accessibilityRole="button"
          accessibilityLabel={t('onboarding.tour.nextA11y')}
          accessibilityState={{ disabled: index >= SLIDES.length - 1 }}
        >
          <ChevronRight size={20} color={THEME.colors.calm.lavenderDeep} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: THEME.spacing.sm,
    marginTop: THEME.spacing.sm,
  },
  list: {
    alignSelf: 'stretch',
  },
  listContent: {
    alignItems: 'stretch',
  },
  slide: {
    gap: THEME.spacing.sm,
    paddingBottom: THEME.spacing.xs,
  },
  kicker: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  body: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: THEME.spacing.xs,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.xs,
  },
  navBtn: {
    width: THEME.sizes.touchTarget,
    height: THEME.sizes.touchTarget,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.card,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: {
    opacity: 0.35,
  },
  navHint: {
    ...THEME.typography.small,
    color: THEME.colors.text.tertiary,
    fontFamily: THEME.fonts.accent.italic,
    textAlign: 'center',
    flex: 1,
    paddingHorizontal: THEME.spacing.xs,
  },
});
