import {
  forwardRef,
  useRef,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type RefreshControlProps,
  type ScrollView as ScrollViewType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME } from '@/constants/theme';
import { screenContentBase } from '@/lib/screenLayout';

export type CalmScreenTopInset = 'md' | 'lg';

type CalmScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  refreshControl?: ReactElement<RefreshControlProps>;
  contentStyle?: StyleProp<ViewStyle>;
  /** Espacio vertical entre hijos (default: sectionGap). */
  gap?: number;
  bottomInset?: boolean;
  /** Reserva espacio para la tab bar flotante (tabs). Desactivar en modales. */
  reserveFloatingTabBar?: boolean;
  /** Padding superior: todas las tabs usan `lg`. */
  topInset?: CalmScreenTopInset;
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
  keyboardDismissMode?: 'none' | 'on-drag' | 'interactive';
  automaticallyAdjustKeyboardInsets?: boolean;
  scrollEnabled?: boolean;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  /** Ref al contenedor interno del scroll (para scrollTo a hijos). */
  scrollContentRef?: RefObject<View | null>;
};

export const CalmScreen = forwardRef<ScrollViewType, CalmScreenProps>(function CalmScreen(
  {
    children,
    scroll = true,
    refreshControl,
    contentStyle,
    gap,
    bottomInset = true,
    reserveFloatingTabBar = true,
    topInset = 'md',
    keyboardShouldPersistTaps,
    keyboardDismissMode,
    automaticallyAdjustKeyboardInsets = false,
    scrollEnabled = true,
    onScroll,
    scrollContentRef,
  },
  ref,
) {
  const insets = useSafeAreaInsets();
  const localContentRef = useRef<View>(null);
  const contentRef = scrollContentRef ?? localContentRef;
  const tabBarClearance =
    bottomInset && reserveFloatingTabBar ? THEME.layout.floatingTabBarClearance : 0;
  const paddingBottom = bottomInset
    ? insets.bottom + THEME.spacing.lg + tabBarClearance
    : THEME.spacing.md;
  const paddingTop =
    insets.top +
    (topInset === 'lg' ? THEME.spacing.lg : THEME.spacing.md);

  const body = (
    <View
      ref={contentRef}
      style={[
        styles.inner,
        screenContentBase(),
        { paddingTop, paddingBottom },
        { gap: gap ?? THEME.layout.sectionGap },
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  const atmosphere = (
    <LinearGradient
      colors={[...THEME.colors.calm.screenWash]}
      locations={[0, 0.45, 1]}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    />
  );

  if (!scroll) {
    return (
      <View style={styles.root}>
        {atmosphere}
        <View style={styles.fill}>{body}</View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {atmosphere}
      <ScrollView
        ref={ref}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={scrollEnabled}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        keyboardDismissMode={keyboardDismissMode}
        automaticallyAdjustKeyboardInsets={automaticallyAdjustKeyboardInsets}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {body}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.colors.calm.background,
  },
  scroll: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
  },
  inner: {},
  fill: {
    flex: 1,
  },
});
