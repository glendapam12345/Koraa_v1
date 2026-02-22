import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { THEME } from '@/constants/theme';
import { ChevronDown, ChevronUp, FolderKanban, Inbox } from 'lucide-react-native';

interface SectionHeaderProps {
  title: string;
  count: number;
  color: string;
  isSuelta?: boolean;
  /** Emoji para la sección (ej. 📋 Tareas sueltas, 📁 Proyecto) */
  emoji?: string;
  /** Descripción breve de la sección (ej. "Tareas del hogar") */
  subtitle?: string;
  /** En tarjetas por área el acento es el borde de la tarjeta; no mostrar barra */
  hideAccentBar?: boolean;
  /** Título más grande para tarjetas por área (estilo QUITNOW) */
  variant?: 'default' | 'card';
  /** Sección desplegable: mostrar chevron y permitir expandir/contraer */
  expandable?: boolean;
  /** Si está expandida (muestra contenido debajo) */
  expanded?: boolean;
  /** Al tocar el encabezado */
  onToggleExpand?: () => void;
}

export function SectionHeader({
  title,
  count,
  color,
  isSuelta,
  emoji,
  subtitle,
  hideAccentBar,
  variant = 'default',
  expandable,
  expanded = true,
  onToggleExpand,
}: SectionHeaderProps) {
  const isCard = variant === 'card';
  const displayEmoji = emoji ?? (isSuelta ? '📋' : '📁');
  const content = (
    <View style={[styles.content, subtitle && styles.contentWithSubtitle]}>
      <View style={styles.titleRow}>
        {!isCard && (isSuelta ? (
          <Inbox size={18} color={THEME.colors.text.secondary} style={styles.icon} />
        ) : (
          <FolderKanban size={18} color={color} style={styles.icon} />
        ))}
        {isCard && <Text style={styles.emoji}>{displayEmoji}</Text>}
        <View style={styles.titleWrap}>
          <Text style={[styles.title, isSuelta && styles.titleSuelta, isCard && styles.titleCard]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
          )}
        </View>
        <View style={[styles.countBadge, isCard && { backgroundColor: color + '20' }]}>
          <Text style={[styles.count, isCard && styles.countCard, isCard && { color }]}>
            {count} {count === 1 ? 'tarea' : 'tareas'}
          </Text>
        </View>
        {expandable && (
          <View style={styles.chevronWrap}>
            {expanded ? (
              <ChevronUp size={22} color={color} strokeWidth={2.5} />
            ) : (
              <ChevronDown size={22} color={color} strokeWidth={2.5} />
            )}
          </View>
        )}
      </View>
    </View>
  );
  return (
    <View style={[styles.wrapper, isCard && styles.wrapperCard]}>
      {!hideAccentBar && <View style={[styles.accentBar, { backgroundColor: color }]} />}
      {expandable && onToggleExpand ? (
        <TouchableOpacity
          onPress={onToggleExpand}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={expanded ? `Contraer ${title}` : `Ver ${count} tareas de ${title}`}
          accessibilityState={{ expanded }}
        >
          {content}
        </TouchableOpacity>
      ) : (
        content
      )}
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
  contentWithSubtitle: {
    alignItems: 'center',
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
  },
  subtitle: {
    ...THEME.typography.small,
    fontSize: 12,
    color: THEME.colors.text.secondary,
    marginTop: 1,
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
  },
  titleSuelta: {
    color: THEME.colors.text.secondary,
  },
  titleCard: {
    fontSize: 18,
    fontFamily: THEME.fonts.heading.bold,
  },
  wrapperCard: {
    marginBottom: THEME.spacing.sm,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: THEME.borderRadius.pill,
  },
  chevronWrap: {
    marginLeft: 4,
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
