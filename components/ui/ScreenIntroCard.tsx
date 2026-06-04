import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';

type ScreenIntroCardProps = {
  children: string;
};

export function ScreenIntroCard({ children }: ScreenIntroCardProps) {
  return (
    <View style={styles.box}>
      <Text style={styles.text}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  text: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    lineHeight: 22,
  },
});
