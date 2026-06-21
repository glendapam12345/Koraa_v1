import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { FrenteChip } from '@/components/frentes/FrenteChip';
import type { CaptureFront } from '@/lib/captureProjectFronts';
import { frontThemeForFront } from '@/lib/frentes/frontTheme';

type FrentesSectionProps = {
  fronts: CaptureFront[];
  onAddFrente?: () => void;
  onSelectFrente?: (frontKey: string) => void;
};

export function FrentesSection({ fronts, onAddFrente, onSelectFrente }: FrentesSectionProps) {
  const { t } = useI18n();

  if (fronts.length === 0 && !onAddFrente) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{t('frentes.yourFronts')}</Text>
      <Text style={styles.sub}>{t('frentes.yourFrontsSub')}</Text>
      <View style={styles.grid}>
        {fronts.map((front, index) => {
          const theme = frontThemeForFront(front, index);
          const displayName = front.name.replace(/\s+App$/i, '');
          return (
            <FrenteChip
              key={front.key}
              emoji={front.emoji}
              name={displayName}
              count={front.tasks.length}
              theme={theme}
              onPress={onSelectFrente ? () => onSelectFrente(front.key) : undefined}
            />
          );
        })}
        {onAddFrente ? (
          <FrenteChip
            emoji=""
            name={t('frentes.newFront')}
            theme={frontThemeForFront({ key: 'loose', name: 'loose' })}
            variant="add"
            onPress={onAddFrente}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.xs,
  },
  title: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    lineHeight: 22,
  },
  sub: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
});
