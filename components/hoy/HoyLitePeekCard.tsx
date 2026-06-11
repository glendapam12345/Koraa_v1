import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { CalmCard } from '@/components/ui/calm/CalmCard';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { useI18n } from '@/contexts/I18nContext';

type HoyLitePeekCardProps = {
  restCount: number;
  onShowMoreForToday: () => void;
  onShowFullView: () => void;
};

/** Día 1: explica qué secciones están guardadas y cómo verlas sin abrumar. */
export function HoyLitePeekCard({
  restCount,
  onShowMoreForToday,
  onShowFullView,
}: HoyLitePeekCardProps) {
  const { t } = useI18n();

  const bodyKey =
    restCount > 0 ? 'hoy.litePeekBodyWithRest' : 'hoy.litePeekBodyNoRest';

  return (
    <CalmCard style={styles.card}>
      <Text style={styles.title}>{t('hoy.litePeekTitle')}</Text>
      <Text style={styles.body}>{t(bodyKey, { count: restCount })}</Text>
      <CalmPrimaryButton
        label={t('hoy.litePeekShowMore')}
        onPress={onShowMoreForToday}
        variant="soft"
        accessibilityLabel={t('hoy.litePeekShowMoreA11y')}
        accessibilityHint={t('hoy.litePeekShowMoreHint')}
      />
      <TouchableOpacity
        onPress={onShowFullView}
        activeOpacity={0.75}
        style={styles.fullViewLink}
        accessibilityRole="button"
        accessibilityLabel={t('hoyExtra.showAllA11y')}
        accessibilityHint={t('hoyExtra.showAllHint')}
      >
        <Text style={styles.fullViewText}>{t('hoy.showAllNow')}</Text>
        <ChevronRight size={16} color={THEME.colors.text.secondary} />
      </TouchableOpacity>
    </CalmCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: THEME.spacing.sm,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    borderColor: THEME.colors.tint.blue.border,
    borderWidth: 1,
  },
  title: {
    ...THEME.typography.sectionTitle,
    color: THEME.colors.text.main,
  },
  body: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
  },
  fullViewLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
    paddingVertical: THEME.spacing.xs,
  },
  fullViewText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
  },
});
