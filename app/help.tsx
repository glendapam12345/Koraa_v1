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
import { useCallback, useMemo, useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';
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

export default function HelpScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const faqItems: FaqItem[] = useMemo(
    () => [
      { id: 'sentir', question: t('help.faq.sentir.q'), answer: t('help.faq.sentir.a') },
      { id: 'tasks', question: t('help.faq.tasks.q'), answer: t('help.faq.tasks.a') },
      { id: 'today', question: t('help.faq.today.q'), answer: t('help.faq.today.a') },
      { id: 'premium', question: t('help.faq.premium.q'), answer: t('help.faq.premium.a') },
      { id: 'data', question: t('help.faq.data.q'), answer: t('help.faq.data.a') },
      { id: 'account', question: t('help.faq.account.q'), answer: t('help.faq.account.a') },
      { id: 'tips', question: t('help.faq.tips.q'), answer: t('help.faq.tips.a') },
    ],
    [t],
  );
  const [expandedId, setExpandedId] = useState<string | null>('sentir');

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
      Alert.alert(t('help.openLinkError'), t('help.openLinkHint', { label }));
    }
  }, [t]);

  const openLegalUrl = useCallback(
    (getter: () => string | null, label: string) => {
      const url = getter();
      if (!url) {
        Alert.alert(label, t('help.linkNotConfigured'));
        return;
      }
      void openUrl(url, label);
    },
    [openUrl, t],
  );

  const openSupportEmail = useCallback(async () => {
    const mailto = getSupportMailtoUrl();
    const can = await Linking.canOpenURL(mailto);
    if (!can) {
      Alert.alert(t('help.emailError'), t('common.retry'));
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
          accessibilityLabel={t('common.back')}
        >
          <ChevronLeft size={28} color={THEME.colors.text.main} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {t('help.title')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + THEME.spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>{t('help.intro')}</Text>

        <Text style={styles.sectionTitle}>{t('help.faqTitle')}</Text>
        {faqItems.map((item) => {
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

        <Text style={styles.sectionTitle}>{t('help.legalTitle')}</Text>
        <Text style={styles.legalHint}>{t('help.legalHint')}</Text>

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => openLegalUrl(getPrivacyPolicyUrl, t('help.privacy'))}
          activeOpacity={0.75}
        >
          <ExternalLink size={20} color={THEME.colors.gradient.blue} />
          <Text style={styles.linkRowText}>{t('help.privacy')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => openLegalUrl(getTermsOfServiceUrl, t('help.terms'))}
          activeOpacity={0.75}
        >
          <ExternalLink size={20} color={THEME.colors.gradient.blue} />
          <Text style={styles.linkRowText}>{t('help.terms')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.supportButton} onPress={openSupportEmail} activeOpacity={0.85}>
          <LinearGradient
            colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.supportGradient}
          >
            <Mail size={20} color={THEME.colors.fill[100]} />
            <Text style={styles.supportButtonText}>{t('help.contactSupport')}</Text>
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
