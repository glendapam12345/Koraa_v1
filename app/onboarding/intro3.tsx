import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { GradientButton } from '@/components/GradientButton';
import { Sparkles } from 'lucide-react-native';

export default function Intro3Screen() {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Sparkles size={32} color={THEME.colors.gradient.pink} />
          </View>
        </View>

        <Text style={styles.title}>Obtén claridad</Text>
        <Text style={styles.titleAccent}>automática</Text>

        <Text style={styles.description}>
          Kora prioriza por ti. Solo enfócate en lo que realmente importa hoy.
        </Text>

        <View style={styles.dotContainer}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <GradientButton
          title="Comenzar →"
          onPress={() => router.push('/auth')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.fill[100],
  },
  content: {
    padding: THEME.spacing.lg,
    paddingTop: THEME.spacing.xl * 2,
  },
  iconContainer: {
    alignItems: 'flex-end',
    marginBottom: THEME.spacing.xl,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: THEME.colors.fill[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...THEME.typography.h1,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.xs,
  },
  titleAccent: {
    ...THEME.typography.h1,
    fontFamily: THEME.fonts.accent.italic,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.lg,
  },
  description: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 28,
  },
  dotContainer: {
    flexDirection: 'row',
    gap: THEME.spacing.xs,
    marginTop: THEME.spacing.xl,
  },
  dot: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME.colors.stroke[100],
  },
  dotActive: {
    backgroundColor: THEME.colors.gradient.blue,
  },
  footer: {
    padding: THEME.spacing.lg,
    paddingBottom: THEME.spacing.xl,
  },
});
