import type { ReactNode } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME } from '@/constants/theme';

type OnboardingScreenShellProps = {
  children: ReactNode;
  footer?: ReactNode;
  /** Fondo más etéreo en welcome / momentos clave. */
  ethereal?: boolean;
};

/** Shell calm compartido para onboarding (gradiente suave + footer sticky). */
export function OnboardingScreenShell({
  children,
  footer,
  ethereal = false,
}: OnboardingScreenShellProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      {ethereal ? (
        <LinearGradient
          colors={[
            THEME.colors.calm.mist,
            THEME.colors.calm.blush,
            THEME.colors.calm.background,
          ]}
          locations={[0, 0.45, 1]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <LinearGradient
          colors={[THEME.colors.calm.background, THEME.colors.calm.mist]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + THEME.spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
      {footer ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + THEME.spacing.lg }]}>
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
    color: THEME.colors.calm.lavenderDeep,
  },
  subtitle: {
    ...THEME.typography.screenSubtitle,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.xs,
  },
  body: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
  },
  iconContainer: {
    alignItems: 'flex-end',
    marginBottom: THEME.spacing.xl,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: THEME.colors.calm.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    ...THEME.shadows.soft,
  },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.colors.calm.background,
  },
  content: {
    padding: THEME.spacing.lg,
    paddingBottom: THEME.spacing.md,
  },
  footer: {
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: THEME.colors.calm.border,
    backgroundColor: 'rgba(248, 245, 252, 0.92)',
  },
});
