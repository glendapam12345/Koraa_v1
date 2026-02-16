import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { FolderKanban, Inbox } from 'lucide-react-native';

interface SectionHeaderProps {
  title: string;
  count: number;
  color: string;
  isSuelta?: boolean;
  /** Emoji para la sección (ej. 📋 Tareas sueltas, 📁 Proyecto) */
  emoji?: string;
  /** En tarjetas por área el acento es el borde de la tarjeta; no mostrar barra */
  hideAccentBar?: boolean;
  /** Título más grande para tarjetas por área (estilo QUITNOW) */
  variant?: 'default' | 'card';
}

export function SectionHeader({ title, count, color, isSuelta, emoji, hideAccentBar, variant = 'default' }: SectionHeaderProps) {
  const isCard = variant === 'card';
  const displayEmoji = emoji ?? (isSuelta ? '📋' : '📁');
  return (
    <View style={[styles.wrapper, isCard && styles.wrapperCard]}>
      {!hideAccentBar && <View style={[styles.accentBar, { backgroundColor: color }]} />}
      <View style={styles.content}>
        {!isCard && (isSuelta ? (
          <Inbox size={18} color={THEME.colors.text.secondary} style={styles.icon} />
        ) : (
          <FolderKanban size={18} color={color} style={styles.icon} />
        ))}
        {isCard && <Text style={styles.emoji}>{displayEmoji}</Text>}
        <Text style={[styles.title, isSuelta && styles.titleSuelta, isCard && styles.titleCard]} numberOfLines={1}>
          {title}
        </Text>
        <View style={[styles.countBadge, isCard && { backgroundColor: color + '20' }]}>
          <Text style={[styles.count, isCard && styles.countCard, isCard && { color }]}>
            {count} {count === 1 ? 'tarea' : 'tareas'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: THEME.spacing.xs,
    marginTop: 0,
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
  emoji: {
    fontSize: 20,
    lineHeight: 24,
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
    marginBottom: THEME.spacing.xs,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.pill,
  },
  countCard: {
    fontSize: 12,
    fontFamily: THEME.fonts.heading.medium,
  },
  count: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    fontSize: 12,
  },
});
