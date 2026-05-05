import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback, useState } from 'react';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { THEME } from '@/constants/theme';
import {
  getPrivacyPolicyUrl,
  getTermsOfServiceUrl,
  getSupportMailtoUrl,
} from '@/constants/legalUrls';
import { ChevronLeft, ChevronDown, ChevronRight, ExternalLink, Mail } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'sentir',
    question: '¿Qué es Sentir?',
    answer:
      'Es tu check-in emocional del día: cómo te sientes, energía, tiempo y foco. Koraa usa eso para sugerir prioridades más acordes a tu estado, no solo a una lista rígida.',
  },
  {
    id: 'vaciar',
    question: '¿Para qué sirve la pestaña Tareas?',
    answer:
      'Ahí capturas y organizas lo pendiente (vacía tu mente, asignar proyecto o fecha). Lo que guardes se prioriza en Hoy según tu check-in en Sentir.',
  },
  {
    id: 'hoy',
    question: '¿Cómo se ordenan las tareas en Hoy?',
    answer:
      'Combinamos tu estado del día (Sentir) con lo que tienes pendiente. Puedes filtrar por «Hoy» o ver «Todas» las pendientes.',
  },
  {
    id: 'premium',
    question: '¿Qué es Koraa Premium y dónde está?',
    answer:
      'El flujo principal (Tareas → Sentir → Hoy) es gratuito. Premium amplía la pestaña Semana: los 7 días completos, filtros avanzados e historial (en gratis ves una muestra). Para suscribirte o restaurar compra: Ajustes → Ver Premium.',
  },
  {
    id: 'datos',
    question: '¿Dónde se guardan mis datos?',
    answer:
      'Tu cuenta y datos se almacenan de forma segura en Supabase, con acceso solo para tu usuario (políticas RLS). No compartimos tu contenido con terceros para publicidad.',
  },
  {
    id: 'cuenta',
    question: '¿Cómo cambio mi contraseña o mi nombre?',
    answer:
      'Desde Yo puedes editar tu perfil (nombre, edad, intereses). Para contraseña, suscripción y acciones de cuenta, entra a Ajustes. El correo de la cuenta se gestiona según tu proveedor de auth.',
  },
  {
    id: 'tips',
    question: '¿Qué es la pestaña Consejos?',
    answer:
      'Sugerencias y tips según tu estado del día (Sentir) y tu perfil. Cuanto más completes el check-in y tu perfil, más relevantes serán. La encuentras en la barra inferior junto a Semana y Yo.',
  },
];

export default function HelpScreen() {
  const insets = useSafeAreaInsets();
  const [expandedId, setExpandedId] = useState<string | null>(FAQ_ITEMS[0]?.id ?? null);

  const openUrl = useCallback(async (url: string, label: string) => {
    try {
      if (Platform.OS === 'web') {
        const w = globalThis as unknown as {
          open?: (u: string, target?: string, features?: string) => void;
        };
        w.open?.(url, '_blank', 'noopener,noreferrer');
        return;
      }
      await WebBrowser.openBrowserAsync(url);
    } catch {
      Alert.alert('No se pudo abrir', `Intenta abrir el enlace de ${label} desde el navegador.`);
    }
  }, []);

  const openLegalUrl = useCallback(
    (getter: () => string | null, label: string) => {
      const url = getter();
      if (!url) {
        Alert.alert(
          label,
          'Aún no hay enlace público configurado. Puedes escribirnos por correo desde «Contactar soporte» o pide el documento al equipo.',
        );
        return;
      }
      void openUrl(url, label);
    },
    [openUrl],
  );

  const openSupportEmail = useCallback(async () => {
    const mailto = getSupportMailtoUrl();
    const can = await Linking.canOpenURL(mailto);
    if (!can) {
      Alert.alert('No disponible', 'No se pudo abrir tu app de correo.');
      return;
    }
    await Linking.openURL(mailto);
  }, []);

  const toggleFaq = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <ChevronLeft size={28} color={THEME.colors.text.main} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Ayuda
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + THEME.spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>
          Aquí tienes respuestas rápidas y enlaces a políticas. Si no encuentras lo que buscas, escríbenos.
        </Text>

        <Text style={styles.sectionTitle}>Preguntas frecuentes</Text>
        {FAQ_ITEMS.map((item) => {
          const open = expandedId === item.id;
          return (
            <View key={item.id} style={styles.faqCard}>
              <TouchableOpacity
                style={styles.faqRow}
                onPress={() => toggleFaq(item.id)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
                accessibilityLabel={item.question}
              >
                <Text style={styles.faqQuestion}>{item.question}</Text>
                {open ? (
                  <ChevronDown size={20} color={THEME.colors.text.secondary} />
                ) : (
                  <ChevronRight size={20} color={THEME.colors.text.secondary} />
                )}
              </TouchableOpacity>
              {open ? <Text style={styles.faqAnswer}>{item.answer}</Text> : null}
            </View>
          );
        })}

        <Text style={styles.sectionTitle}>Legal</Text>
        <Text style={styles.legalHint}>
          Puedes definir URLs públicas en tu proyecto con variables{' '}
          <Text style={styles.legalHintMono}>EXPO_PUBLIC_PRIVACY_POLICY_URL</Text> y{' '}
          <Text style={styles.legalHintMono}>EXPO_PUBLIC_TERMS_OF_SERVICE_URL</Text>.
        </Text>

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => openLegalUrl(getPrivacyPolicyUrl, 'Política de privacidad')}
          activeOpacity={0.75}
        >
          <ExternalLink size={20} color={THEME.colors.gradient.blue} />
          <Text style={styles.linkRowText}>Política de privacidad</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => openLegalUrl(getTermsOfServiceUrl, 'Términos del servicio')}
          activeOpacity={0.75}
        >
          <ExternalLink size={20} color={THEME.colors.gradient.blue} />
          <Text style={styles.linkRowText}>Términos del servicio</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.supportButton} onPress={openSupportEmail} activeOpacity={0.85}>
          <LinearGradient
            colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.supportGradient}
          >
            <Mail size={20} color={THEME.colors.fill[100]} />
            <Text style={styles.supportButtonText}>Contactar soporte</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.colors.fill[100],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.sm,
    paddingBottom: THEME.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.stroke[100],
  },
  backButton: {
    padding: THEME.spacing.xs,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
  },
  headerTitle: {
    ...THEME.typography.h2,
    flex: 1,
    textAlign: 'center',
    color: THEME.colors.text.main,
  },
  headerSpacer: {
    width: 44,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: THEME.spacing.lg,
  },
  intro: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.lg,
    lineHeight: 24,
  },
  sectionTitle: {
    ...THEME.typography.h3,
    fontSize: 18,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    marginBottom: THEME.spacing.sm,
  },
  faqCard: {
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
    marginBottom: THEME.spacing.sm,
    overflow: 'hidden',
    ...THEME.shadows.soft,
  },
  faqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  faqQuestion: {
    ...THEME.typography.body,
    flex: 1,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
  },
  faqAnswer: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    paddingHorizontal: THEME.spacing.md,
    paddingBottom: THEME.spacing.md,
    lineHeight: 22,
  },
  legalHint: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.md,
    lineHeight: 20,
  },
  legalHintMono: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontSize: 12,
    color: THEME.colors.text.main,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    paddingVertical: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.stroke[100],
  },
  linkRowText: {
    ...THEME.typography.body,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.medium,
  },
  supportButton: {
    marginTop: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.rounded,
    overflow: 'hidden',
    minHeight: THEME.sizes.touchTarget,
    ...THEME.shadows.card,
  },
  supportGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.sm,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
  },
  supportButtonText: {
    ...THEME.typography.body,
    color: THEME.colors.fill[100],
    fontFamily: THEME.fonts.heading.bold,
  },
});
