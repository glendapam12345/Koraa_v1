import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { PremiumBadge } from '@/components/premium/PremiumBadge';

type YoSpaceHeroProps = {
  displayName: string;
  email?: string | null;
  avatarLetter: string;
  showPremiumBadge?: boolean;
  viewProfileLabel: string;
  onPress: () => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
};

/** Identidad compacta — una fila tocable, sin tarjeta enorme. */
export function YoSpaceHero({
  displayName,
  email,
  avatarLetter,
  showPremiumBadge = false,
  viewProfileLabel,
  onPress,
  accessibilityLabel,
  accessibilityHint,
}: YoSpaceHeroProps) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint ?? viewProfileLabel}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{avatarLetter}</Text>
      </View>

      <View style={styles.copy}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          {showPremiumBadge ? <PremiumBadge compact /> : null}
        </View>
        {email ? (
          <Text style={styles.email} numberOfLines={1}>
            {email}
          </Text>
        ) : (
          <Text style={styles.email} numberOfLines={1}>
            {viewProfileLabel}
          </Text>
        )}
      </View>

      <ChevronRight size={20} color={THEME.colors.text.tertiary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    minHeight: THEME.sizes.touchTarget,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.calm.card,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.calm.mist,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  avatarText: {
    ...THEME.typography.body,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    flexWrap: 'wrap',
  },
  name: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    flexShrink: 1,
  },
  email: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
  },
});
