import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Clock, Zap } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

type HoyCurrentStateCardProps = {
  emotionEmoji: string;
  emotionLabel: string;
  energyLevel: number;
  availableTime?: string;
  onEdit: () => void;
};

const ENERGY_MAX = 5;

export function HoyCurrentStateCard({
  emotionEmoji,
  emotionLabel,
  energyLevel,
  availableTime = '',
  onEdit,
}: HoyCurrentStateCardProps) {
  const { t } = useI18n();
  const energyPercent = Math.max(0, Math.min(100, (energyLevel / ENERGY_MAX) * 100));

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('hoy.currentStateTitle')}</Text>
        <TouchableOpacity
          onPress={onEdit}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t('hoy.currentStateEditA11y')}
        >
          <Text style={styles.edit}>{t('hoy.currentStateEdit')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        <View style={styles.cell}>
          <Text style={styles.cellEmoji}>{emotionEmoji}</Text>
          <Text style={styles.cellLabel} numberOfLines={2}>
            {emotionLabel}
          </Text>
        </View>

        <View style={styles.cell}>
          <View style={styles.energyHeader}>
            <Zap size={14} color={THEME.colors.calm.lavenderDeep} />
            <Text style={styles.cellMeta}>
              {t('hoy.moodHeroEnergy', { level: energyLevel })}
            </Text>
          </View>
          <View style={styles.energyTrack}>
            <View style={[styles.energyFill, { width: `${energyPercent}%` }]} />
          </View>
        </View>

        {availableTime ? (
          <View style={styles.cell}>
            <View style={styles.energyHeader}>
              <Clock size={14} color={THEME.colors.calm.lavenderDeep} />
              <Text style={styles.cellMeta}>{t('hoy.currentStateTime')}</Text>
            </View>
            <Text style={styles.cellLabel} numberOfLines={2}>
              {availableTime}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...THEME.surfaces.panel,
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    padding: THEME.spacing.sm,
    gap: THEME.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...THEME.typography.small,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    lineHeight: 22,
  },
  edit: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
    lineHeight: 18,
  },
  grid: {
    gap: THEME.spacing.xs,
  },
  cell: {
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.standard,
    backgroundColor: THEME.colors.calm.mist,
    gap: 6,
  },
  cellEmoji: {
    fontSize: 24,
    lineHeight: 28,
  },
  cellLabel: {
    ...THEME.typography.small,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
    lineHeight: 20,
  },
  cellMeta: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 16,
  },
  energyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  energyTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.colors.calm.mist,
    overflow: 'hidden',
  },
  energyFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: THEME.colors.calm.lavenderDeep,
    minWidth: 4,
  },
});
