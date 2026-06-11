import {
  forwardRef,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  type RefreshControlProps,
  type ScrollView as ScrollViewType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
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
  },
  ref,
) {
  const insets = useSafeAreaInsets();
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

  if (!scroll) {
    return (
      <View style={styles.root}>
        <View style={styles.fill}>{body}</View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        keyboardDismissMode={keyboardDismissMode}
        contentContainerStyle={styles.scrollGrow}
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
  scrollGrow: {
    flexGrow: 1,
  },
  inner: {},
  fill: {
    flex: 1,
  },
});
