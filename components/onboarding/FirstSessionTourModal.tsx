import { useEffect, useState, useCallback } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { markFirstSessionTourSeen } from '@/lib/firstSessionTour';
import { Edit3, Heart, Home } from 'lucide-react-native';

type StepDef = {
  tabLabel: string;
  title: string;
  body: string;
  Icon: typeof Edit3;
};

const STEPS: StepDef[] = [
  {
    tabLabel: 'Tareas',
    title: 'Primero, vuelca tu mente',
    body:
      'En la pestaña Tareas escribe lo pendiente sin forzar orden. Proyecto, fecha y prioridad son opcionales: puedes solo escribir y soltar.',
    Icon: Edit3,
  },
  {
    tabLabel: 'Sentir',
    title: 'Luego, registra cómo estás',
    body:
      'En Sentir haces el check-in del día: emoción, energía, tiempo y foco. Koraa usa eso para ordenar lo importante, no solo la lista.',
    Icon: Heart,
  },
  {
    tabLabel: 'Hoy',
    title: 'Por último, mira tu día',
    body:
      'En Hoy ves qué atender primero según cómo te sientes. Puedes volver a Sentir cuando cambie tu estado.',
    Icon: Home,
  },
];

type Props = {
  visible: boolean;
  userId: string;
  onFinished: () => void;
};

export function FirstSessionTourModal({ visible, userId, onFinished }: Props) {
  const insets = useSafeAreaInsets();
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (visible) {
      setStepIndex(0);
    }
  }, [visible, userId]);

  const finish = useCallback(async () => {
    await markFirstSessionTourSeen(userId);
    onFinished();
  }, [userId, onFinished]);

  const handleNext = () => {
    if (stepIndex < STEPS.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      void finish();
    }
  };

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;
  const { Icon } = step;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={() => void finish()}
    >
      <View style={styles.overlay} accessibilityViewIsModal>
        <View
          style={[
            styles.card,
            { paddingBottom: THEME.spacing.xl + Math.max(insets.bottom, THEME.spacing.sm) },
          ]}
        >
          <View style={styles.iconWrap}>
            <Icon size={40} color={THEME.colors.gradient.blue} strokeWidth={2} />
          </View>

          <Text style={styles.tabPill}>{step.tabLabel}</Text>
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.body}>{step.body}</Text>

          <View style={styles.dots}>
            {STEPS.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === stepIndex && styles.dotActive]}
                accessibilityElementsHidden
                importantForAccessibility="no"
              />
            ))}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() => void finish()}
              style={styles.skipBtn}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Omitir tour"
            >
              <Text style={styles.skipText}>Omitir tour</Text>
            </TouchableOpacity>
            <View style={styles.actionsSpacer} />
            <TouchableOpacity
              onPress={handleNext}
              style={styles.primaryWrap}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={isLast ? 'Cerrar tour y continuar' : 'Siguiente paso del tour'}
            >
              <LinearGradient
                colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryGradient}
              >
                <Text style={styles.primaryText}>{isLast ? 'Listo' : 'Siguiente'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: THEME.colors.overlayStrong,
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.lg,
  },
  card: {
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.xl,
    width: '100%',
    maxWidth: 400,
    ...THEME.shadows.soft,
  },
  iconWrap: {
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  tabPill: {
    alignSelf: 'center',
    ...THEME.typography.caption,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
    marginBottom: THEME.spacing.sm,
  },
  title: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    textAlign: 'center',
    marginBottom: THEME.spacing.sm,
  },
  body: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: THEME.spacing.lg,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: THEME.spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.colors.stroke[100],
  },
  dotActive: {
    backgroundColor: THEME.colors.gradient.blue,
    width: 22,
    borderRadius: 4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skipBtn: {
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.xs,
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
  },
  skipText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
  },
  actionsSpacer: {
    flex: 1,
    minWidth: THEME.spacing.sm,
  },
  primaryWrap: {
    minWidth: 140,
  },
  primaryGradient: {
    paddingVertical: THEME.spacing.sm + 2,
    paddingHorizontal: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: THEME.sizes.touchTarget,
  },
  primaryText: {
    ...THEME.typography.body,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
  },
});
