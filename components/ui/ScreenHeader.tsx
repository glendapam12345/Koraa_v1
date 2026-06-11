import type { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  /** Título más pequeño y menos aire (p. ej. Para mí). */
  compact?: boolean;
  /** Contenido bajo el subtítulo (p. ej. barra de progreso). */
  children?: ReactNode;
  trailing?: ReactNode;
};

/** Título + subtítulo estándar en tabs (Tips, Semana, Vaciar). */
export function ScreenHeader({
  title,
  subtitle,
  compact = false,
  children,
  trailing,
}: ScreenHeaderProps) {
  return (
    <View style={[styles.block, compact && styles.blockCompact]}>
      <View style={styles.row}>
        <View style={[styles.textCol, compact && styles.textColCompact]}>
          <Text
            style={[styles.title, compact && styles.titleCompact]}
            accessibilityRole="header"
          >
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
  blockCompact: {
    gap: THEME.spacing.xs,
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
  textColCompact: {
    gap: 2,
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
  titleCompact: {
    ...THEME.typography.sectionTitle,
  },
  subtitle: {
    ...THEME.typography.screenSubtitle,
    color: THEME.colors.text.secondary,
  },
});
