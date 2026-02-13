import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { FolderKanban, Inbox } from 'lucide-react-native';

interface SectionHeaderProps {
  title: string;
  count: number;
  color: string;
  isSuelta?: boolean;
}

export function SectionHeader({ title, count, color, isSuelta }: SectionHeaderProps) {
  return (
    <View style={styles.wrapper}>
      <View style={[styles.accentBar, { backgroundColor: color }]} />
      <View style={styles.content}>
        {isSuelta ? (
          <Inbox size={18} color={THEME.colors.text.secondary} style={styles.icon} />
        ) : (
          <FolderKanban size={18} color={color} style={styles.icon} />
        )}
        <Text style={[styles.title, isSuelta && styles.titleSuelta]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.count}>
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
  count: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    fontSize: 12,
  },
});
