import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { FolderKanban, Inbox } from 'lucide-react-native';

interface SectionHeaderProps {
  title: string;
  count: number;
  color: string;
  isSuelta?: boolean;
  /** En tarjetas por área el acento es el borde de la tarjeta; no mostrar barra */
  hideAccentBar?: boolean;
  /** Título más grande para tarjetas por área (estilo QUITNOW) */
  variant?: 'default' | 'card';
}

export function SectionHeader({ title, count, color, isSuelta, hideAccentBar, variant = 'default' }: SectionHeaderProps) {
  const isCard = variant === 'card';
  return (
    <View style={[styles.wrapper, isCard && styles.wrapperCard]}>
      {!hideAccentBar && <View style={[styles.accentBar, { backgroundColor: color }]} />}
      <View style={styles.content}>
        {isSuelta ? (
          <Inbox size={isCard ? 20 : 18} color={THEME.colors.text.secondary} style={styles.icon} />
        ) : (
          <FolderKanban size={isCard ? 20 : 18} color={color} style={styles.icon} />
        )}
        <Text style={[styles.title, isSuelta && styles.titleSuelta, isCard && styles.titleCard]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.count, isCard && styles.countCard]}>
          {count} {count === 1 ? 'tarea' : 'tareas'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: THEME.spacing.sm,
    marginTop: THEME.spacing.xs,
  },
  accentBar: {
    width: 4,
    borderRadius: 2,
    marginRight: THEME.spacing.sm,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    opacity: 0.9,
  },
  title: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    flex: 1,
  },
  titleSuelta: {
    color: THEME.colors.text.secondary,
  },
  titleCard: {
    fontSize: 16,
    fontFamily: THEME.fonts.heading.bold,
  },
  wrapperCard: {
    marginBottom: THEME.spacing.sm,
  },
  countCard: {
    fontSize: 13,
  },
  count: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    fontSize: 12,
  },
});
