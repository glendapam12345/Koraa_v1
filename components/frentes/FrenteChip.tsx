import { Text, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { FrontTheme } from '@/lib/frentes/frontTheme';

type FrenteChipProps = {
  emoji: string;
  name: string;
  count?: number;
  theme: FrontTheme;
  selected?: boolean;
  onPress?: () => void;
  variant?: 'default' | 'add';
};

export function FrenteChip({
  emoji,
  name,
  count,
  theme,
  selected,
  onPress,
  variant = 'default',
}: FrenteChipProps) {
  const { t } = useI18n();
  const isAdd = variant === 'add';

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        isAdd ? styles.chipAdd : { backgroundColor: theme.bg, borderColor: theme.border },
        selected && styles.chipSelected,
      ]}
      onPress={onPress}
      activeOpacity={0.88}
      accessibilityRole="button"
      disabled={!onPress}
    >
      {isAdd ? (
        <Plus size={18} color={THEME.colors.calm.lavenderDeep} />
      ) : (
        <Text style={styles.emoji}>{emoji}</Text>
      )}
      <View style={styles.textCol}>
        <Text style={[styles.name, isAdd && styles.nameAdd]} numberOfLines={1}>
          {name}
        </Text>
        {!isAdd && count != null ? (
          <Text style={[styles.count, { color: theme.accent }]}>
            {count === 1 ? t('frentes.chipCountOne') : t('frentes.chipCount', { count })}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flex: 1,
    minWidth: '46%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    ...THEME.shadows.soft,
  },
  chipAdd: {
    backgroundColor: THEME.colors.calm.card,
    borderStyle: 'dashed',
    borderColor: THEME.colors.calm.lavenderDeep,
  },
  chipSelected: {
    borderWidth: 2,
  },
  emoji: {
    fontSize: THEME.typography.displayEmojiMd.fontSize,
    lineHeight: 26,
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...THEME.typography.small,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    lineHeight: 18,
  },
  nameAdd: {
    color: THEME.colors.calm.lavenderDeep,
  },
  count: {
    ...THEME.typography.meta,
    fontFamily: THEME.fonts.heading.medium,
  },
});
