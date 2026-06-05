import type { ReactNode } from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { THEME } from '@/constants/theme';

type CalmCardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  tinted?: boolean;
};

export function CalmCard({ children, style, tinted }: CalmCardProps) {
  return (
    <View
      style={[
        styles.card,
        tinted && styles.cardTinted,
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
});
