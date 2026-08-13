import type { ReactNode } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME } from '@/constants/theme';

type OnboardingScreenShellProps = {
  children: ReactNode;
  footer?: ReactNode;
  /** Contenido centrado verticalmente (welcome). */
  centered?: boolean;
};

/**
 * Shell calm del onboarding: atmósfera lavanda suave, alineado con CalmScreen.
 */
export function OnboardingScreenShell({
  children,
  footer,
  centered = false,
}: OnboardingScreenShellProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[...THEME.colors.calm.screenWash]}
        locations={[0, 0.45, 1]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          centered && styles.contentCentered,
          {
            paddingTop: insets.top + (centered ? THEME.spacing.xl : THEME.spacing.xl),
            paddingBottom: footer ? THEME.spacing.md : insets.bottom + THEME.spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>

      {footer ? (
        <View
          style={[
            styles.footer,
            { paddingBottom: insets.bottom + THEME.spacing.lg },
          ]}
        >
          {footer}
        </View>
      ) : null}
    </View>
  );
}

export const onboardingTypography = StyleSheet.create({
  title: {
    ...THEME.typography.h1,
    color: THEME.colors.text.main,
  },
  titleAccent: {
    ...THEME.typography.h1,
    fontFamily: THEME.fonts.accent.italic,
    color: THEME.colors.text.main,
  },
  subtitle: {
    ...THEME.typography.screenSubtitle,
    color: THEME.colors.text.secondary,
    marginTop: THEME.spacing.xs,
    marginBottom: THEME.spacing.md,
    lineHeight: 24,
  },
  body: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
  },
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
  content: {
    paddingHorizontal: THEME.layout.screenPaddingX,
    flexGrow: 1,
  },
  contentCentered: {
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: THEME.layout.screenPaddingX,
    paddingTop: THEME.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: THEME.colors.calm.border,
    backgroundColor: THEME.colors.calmScrim,
  },
});
