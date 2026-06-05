import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';

type PersonalizedBannerProps = {
  displayName: string;
  message: string;
  subtitle?: string;
};

export function PersonalizedBanner({
  displayName,
  message,
  subtitle,
}: PersonalizedBannerProps) {
  const firstName = displayName.split(/\s+/)[0] ?? displayName;

  return (
    <LinearGradient
      colors={[THEME.colors.calm.blush, THEME.colors.calm.lavender]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.wrap}
    >
      <View style={styles.textCol}>
        <Text style={styles.greeting}>{firstName}</Text>
        <Text style={styles.message}>{message}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: THEME.borderRadius.card,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  textCol: {
    gap: 6,
  },
  greeting: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
    textTransform: 'capitalize',
  },
  message: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    lineHeight: 22,
    fontFamily: THEME.fonts.heading.medium,
  },
  subtitle: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
});
