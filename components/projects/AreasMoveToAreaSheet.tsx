import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRightLeft, Plus, X } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { LifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';
import type { ResolvedLifeArea } from '@/lib/lifeAreas/userLifeAreas';
import { LOOSE_LIFE_AREA_ID } from '@/lib/lifeAreas/projectToLifeArea';

export type AreasMoveTarget =
  | {
      kind: 'loose';
      taskId: string;
      title: string;
      currentAreaRef: LifeAreaRef | null;
    }
  | {
      kind: 'project';
      taskId: string;
      projectId: string;
      projectName: string;
      title: string;
      currentAreaRef: LifeAreaRef;
    };

type AreasMoveToAreaSheetProps = {
  visible: boolean;
  target: AreasMoveTarget | null;
  areas: ResolvedLifeArea[];
  onClose: () => void;
  onSelectArea: (areaRef: LifeAreaRef) => void;
  onAddArea?: () => void;
};

export function AreasMoveToAreaSheet({
  visible,
  target,
  areas,
  onClose,
  onSelectArea,
  onAddArea,
}: AreasMoveToAreaSheetProps) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  if (!target) return null;

  const isLoose = target.kind === 'loose';
  const currentRef = target.currentAreaRef;
  const effectiveCurrentRef =
    isLoose && (currentRef == null || currentRef === 'other') ? 'other' : currentRef;

  const handleSelect = (areaRef: LifeAreaRef) => {
    onSelectArea(areaRef);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={t('components.closeA11y')} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, THEME.spacing.md) }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headerText}>
              <View style={styles.headerRow}>
                <ArrowRightLeft size={18} color={THEME.colors.calm.lavenderDeep} />
                <Text style={styles.title}>{t('areasCompact.moveSheetTitle')}</Text>
              </View>
              <Text style={styles.taskTitle} numberOfLines={2}>
                {target.title}
              </Text>
              {target.kind === 'project' ? (
                <Text style={styles.projectHint}>
                  {t('areasCompact.moveSheetProjectHint', { name: target.projectName })}
                </Text>
              ) : null}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel={t('components.closeA11y')}>
              <X size={22} color={THEME.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {areas.map((area) => {
              const active = effectiveCurrentRef === area.ref;
              return (
                <TouchableOpacity
                  key={area.ref}
                  style={[
                    styles.option,
                    active && styles.optionActive,
                    { borderLeftColor: area.color, borderLeftWidth: 3 },
                  ]}
                  onPress={() => handleSelect(area.ref)}
                  disabled={active}
                  activeOpacity={0.85}
                >
                  <Text style={styles.emoji}>{area.emoji}</Text>
                  <Text style={[styles.optionLabel, active && styles.optionLabelActive]} numberOfLines={2}>
                    {area.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {onAddArea ? (
              <TouchableOpacity
                style={styles.addOption}
                onPress={() => {
                  onClose();
                  onAddArea();
                }}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={t('areasCompact.newAreaA11y')}
              >
                <Plus size={16} color={THEME.colors.calm.lavenderDeep} />
                <Text style={styles.addLabel}>{t('areasCompact.newArea')}</Text>
              </TouchableOpacity>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export { LOOSE_LIFE_AREA_ID };

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: THEME.colors.overlay,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: THEME.colors.fill[100],
    borderTopLeftRadius: THEME.borderRadius.rounded,
    borderTopRightRadius: THEME.borderRadius.rounded,
    paddingHorizontal: THEME.layout.screenPaddingX,
    paddingTop: THEME.spacing.sm,
    maxHeight: '78%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME.colors.calm.border,
    marginBottom: THEME.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.sm,
  },
  headerText: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
  },
  title: {
    ...THEME.typography.screenSubtitle,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  taskTitle: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
  },
  projectHint: {
    ...THEME.typography.small,
    color: THEME.colors.calm.lavenderDeep,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  closeBtn: {
    minWidth: THEME.sizes.touchTarget,
    minHeight: THEME.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    gap: THEME.spacing.xs,
    paddingBottom: THEME.spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.standard,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    backgroundColor: THEME.colors.fill[100],
    minHeight: THEME.sizes.touchTarget,
  },
  optionActive: {
    borderColor: THEME.colors.calm.lavenderDeep,
    backgroundColor: THEME.colors.calm.lavender,
    opacity: 0.9,
  },
  emoji: {
    fontSize: 18,
    lineHeight: 22,
  },
  optionLabel: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
    flex: 1,
    lineHeight: 20,
  },
  optionLabelActive: {
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
  },
  addOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.standard,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: THEME.colors.calm.lavenderDeep,
    minHeight: THEME.sizes.touchTarget,
    marginTop: THEME.spacing.xs,
  },
  addLabel: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.calm.lavenderDeep,
  },
});
