import type { ReactNode } from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';

type CalmCardVariant = 'default' | 'tinted' | 'hero' | 'soft';

type CalmCardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** @deprecated Prefer `variant="tinted"` */
  tinted?: boolean;
  /** default = elevated card; tinted/hero/soft = more color temperature */
  variant?: CalmCardVariant;
};

export function CalmCard({ children, style, tinted, variant = 'default' }: CalmCardProps) {
  const resolved: CalmCardVariant = tinted ? 'tinted' : variant;

  if (resolved === 'hero') {
    return (
      <LinearGradient
        colors={[...THEME.colors.calm.heroWash]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.95, y: 1 }}
        style={[styles.card, styles.cardHero, style]}
      >
        {children}
      </LinearGradient>
    );
  }

  return (
    <View
      style={[
        styles.card,
        resolved === 'tinted' && styles.cardTinted,
        resolved === 'soft' && styles.cardSoft,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...THEME.surfaces.elevated,
    padding: THEME.spacing.md,
  },
  cardTinted: {
    ...THEME.surfaces.tinted,
    padding: THEME.spacing.md,
  },
  cardHero: {
    ...THEME.surfaces.hero,
    backgroundColor: 'transparent',
    padding: THEME.spacing.md,
  },
  cardSoft: {
    ...THEME.surfaces.soft,
    padding: THEME.spacing.md,
  },
});
