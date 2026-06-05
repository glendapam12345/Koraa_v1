import { View, Text, Pressable } from 'react-native';
import { Globe } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { AppLocale } from '@/lib/i18n';
import { settingsScreenStyles as styles } from '@/components/settings/settingsScreenStyles';

type SettingsLanguageSectionProps = {
  locale: AppLocale;
  onSelectLocale: (locale: AppLocale) => void;
};

export function SettingsLanguageSection({ locale, onSelectLocale }: SettingsLanguageSectionProps) {
  const { t } = useI18n();

  return (
    <View style={styles.panelSection}>
      <View style={styles.panelSectionHeader}>
        <Globe size={20} color={THEME.colors.calm.lavenderDeep} />
        <Text style={styles.panelSectionTitle}>{t('language.section')}</Text>
      </View>
      <Text style={styles.panelSectionHint}>{t('language.hint')}</Text>
      <View style={styles.chipsWrap}>
        {(['es', 'en'] as const).map((code) => (
          <Pressable
            key={code}
            style={[styles.chip, locale === code && styles.chipActive]}
            onPress={() => onSelectLocale(code)}
            accessibilityRole="button"
            accessibilityState={{ selected: locale === code }}
            accessibilityLabel={code === 'es' ? t('language.spanish') : t('language.english')}
            accessibilityHint={t('settingsA11y.languageHint')}
          >
            <Text style={[styles.chipText, locale === code && styles.chipTextActive]}>
              {code === 'es' ? t('language.spanish') : t('language.english')}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
