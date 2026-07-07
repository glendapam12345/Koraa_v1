import type { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';

type HoyPlanSubsectionProps = {
  title: string;
  hint?: string;
  children: ReactNode;
};

export function HoyPlanSubsection({ title, hint, children }: HoyPlanSubsectionProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.xs,
  },
  header: {
    gap: 2,
    paddingHorizontal: 2,
  },
  title: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    lineHeight: 18,
  },
  hint: {
    ...THEME.typography.micro,
    color: THEME.colors.text.secondary,
    lineHeight: 16,
  },
});
