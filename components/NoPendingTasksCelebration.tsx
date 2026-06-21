import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { CheckCircle2 } from 'lucide-react-native';
import { useI18n } from '@/contexts/I18nContext';
import { CalmCard } from '@/components/ui/calm/CalmCard';

interface NoPendingTasksCelebrationProps {
  onDismiss: () => void;
}

export function NoPendingTasksCelebration({ onDismiss }: NoPendingTasksCelebrationProps) {
  const { t } = useI18n();

  return (
    <View style={styles.container}>
      <CalmCard style={styles.card}>
        <View style={styles.iconContainer}>
          <CheckCircle2 size={18} color={THEME.colors.calm.lavenderDeep} />
        </View>

        <Text style={styles.title}>{t('celebration.title')}</Text>
        <Text style={styles.message}>{t('celebration.message')}</Text>

        <TouchableOpacity
          style={styles.dismissButton}
          onPress={onDismiss}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={t('celebration.dismiss')}
        >
          <Text style={styles.dismissButtonText}>{t('celebration.dismiss')}</Text>
        </TouchableOpacity>
      </CalmCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: THEME.spacing.sm,
  },
  card: {
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    alignItems: 'flex-start',
    gap: 6,
    borderColor: THEME.colors.calm.border,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
  },
  title: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  message: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  dismissButton: {
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
    marginTop: 2,
  },
  dismissButtonText: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
});
