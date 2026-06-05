import type { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  /** Contenido bajo el subtítulo (p. ej. barra de progreso). */
  children?: ReactNode;
  trailing?: ReactNode;
};

/** Título + subtítulo estándar en tabs (Tips, Semana, Vaciar). */
export function ScreenHeader({ title, subtitle, children, trailing }: ScreenHeaderProps) {
  return (
    <View style={styles.block}>
      <View style={styles.row}>
        <View style={styles.textCol}>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: THEME.spacing.sm,
    alignSelf: 'stretch',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.md,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: THEME.spacing.xs,
  },
  trailing: {
    flexDirection: 'row',
    gap: THEME.spacing.xs,
    paddingTop: 4,
  },
  title: {
    ...THEME.typography.screenTitle,
    color: THEME.colors.text.main,
  },
  subtitle: {
    ...THEME.typography.screenSubtitle,
    color: THEME.colors.text.secondary,
  },
});
