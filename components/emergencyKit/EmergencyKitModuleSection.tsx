import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Image,
} from 'react-native';
import { Plus, Trash2, ExternalLink, Phone, MessageCircle } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { ComfortItem, EmergencyKitModuleId } from '@/lib/emergencyKit/types';

type EmergencyKitModuleSectionProps = {
  moduleId: EmergencyKitModuleId;
  items: ComfortItem[];
  recommendedIds: string[];
  onAdd: () => void;
  onDelete: (id: string) => void;
};

function openUrl(url: string) {
  void Linking.openURL(url);
}

function callPhone(phone: string) {
  void Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);
}

function smsPhone(phone: string) {
  void Linking.openURL(`sms:${phone.replace(/\s/g, '')}`);
}

export function EmergencyKitModuleSection({
  moduleId,
  items,
  recommendedIds,
  onAdd,
  onDelete,
}: EmergencyKitModuleSectionProps) {
  const { t } = useI18n();
  const moduleItems = items.filter((i) => i.type === moduleId);
  const sorted = [...moduleItems].sort((a, b) => {
    const aRec = recommendedIds.includes(a.id) ? 0 : 1;
    const bRec = recommendedIds.includes(b.id) ? 0 : 1;
    return aRec - bRec;
  });

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>{t(`emergencyKit.modules.${moduleId}.title`)}</Text>
        <Text style={styles.subtitle}>{t(`emergencyKit.modules.${moduleId}.subtitle`)}</Text>
      </View>

      {sorted.length === 0 ? (
        <Text style={styles.empty}>{t(`emergencyKit.modules.${moduleId}.empty`)}</Text>
      ) : (
        sorted.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            {item.type === 'music' && item.coverUrl ? (
              <Image source={{ uri: item.coverUrl }} style={styles.thumb} />
            ) : null}
            {item.type === 'movies' && item.posterUrl ? (
              <Image source={{ uri: item.posterUrl }} style={styles.thumb} />
            ) : null}
            {item.type === 'books' && item.coverUrl ? (
              <Image source={{ uri: item.coverUrl }} style={styles.thumb} />
            ) : null}

            <View style={styles.itemBody}>
              {recommendedIds.includes(item.id) ? (
                <Text style={styles.recommended}>{t('emergencyKit.recommended')}</Text>
              ) : null}

              {item.type === 'letters' ? (
                <Text style={styles.itemTitle}>{item.content}</Text>
              ) : item.type === 'support_circle' ? (
                <>
                  <Text style={styles.itemTitle}>{item.name}</Text>
                  {item.relationship ? (
                    <Text style={styles.itemMeta}>{item.relationship}</Text>
                  ) : null}
                  <View style={styles.actionRow}>
                    {item.phone ? (
                      <>
                        <TouchableOpacity
                          style={styles.actionBtn}
                          onPress={() => callPhone(item.phone!)}
                          accessibilityLabel={t('emergencyKit.call')}
                        >
                          <Phone size={16} color={THEME.colors.calm.lavenderDeep} />
                          <Text style={styles.actionText}>{t('emergencyKit.call')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionBtn}
                          onPress={() => smsPhone(item.phone!)}
                          accessibilityLabel={t('emergencyKit.message')}
                        >
                          <MessageCircle size={16} color={THEME.colors.calm.lavenderDeep} />
                          <Text style={styles.actionText}>{t('emergencyKit.message')}</Text>
                        </TouchableOpacity>
                      </>
                    ) : null}
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  {item.type === 'music' && item.artist ? (
                    <Text style={styles.itemMeta}>{item.artist}</Text>
                  ) : null}
                  {item.type === 'books' && item.author ? (
                    <Text style={styles.itemMeta}>{item.author}</Text>
                  ) : null}
                  {item.type === 'movies' && item.platform ? (
                    <Text style={styles.itemMeta}>{item.platform}</Text>
                  ) : null}
                  {item.type === 'shows' && item.platform ? (
                    <Text style={styles.itemMeta}>
                      {item.platform}
                      {item.seasons ? ` · ${item.seasons}` : ''}
                    </Text>
                  ) : null}
                  {item.type === 'memory_box' && item.note ? (
                    <Text style={styles.itemMeta}>{item.note}</Text>
                  ) : null}
                  {item.type === 'places' && item.notes ? (
                    <Text style={styles.itemMeta}>{item.notes}</Text>
                  ) : null}
                </>
              )}

              {item.type === 'music' && item.spotifyUrl ? (
                <TouchableOpacity
                  style={styles.linkBtn}
                  onPress={() => openUrl(item.spotifyUrl!)}
                >
                  <ExternalLink size={14} color={THEME.colors.calm.lavenderDeep} />
                  <Text style={styles.linkText}>{t('emergencyKit.openSpotify')}</Text>
                </TouchableOpacity>
              ) : null}
              {(item.type === 'movies' || item.type === 'shows') && item.watchUrl ? (
                <TouchableOpacity
                  style={styles.linkBtn}
                  onPress={() => openUrl(item.watchUrl!)}
                >
                  <ExternalLink size={14} color={THEME.colors.calm.lavenderDeep} />
                  <Text style={styles.linkText}>{t('emergencyKit.watch')}</Text>
                </TouchableOpacity>
              ) : null}
              {item.type === 'internet' && item.url ? (
                <TouchableOpacity style={styles.linkBtn} onPress={() => openUrl(item.url!)}>
                  <ExternalLink size={14} color={THEME.colors.calm.lavenderDeep} />
                  <Text style={styles.linkText}>{t('emergencyKit.openLink')}</Text>
                </TouchableOpacity>
              ) : null}
              {item.type === 'places' && item.mapUrl ? (
                <TouchableOpacity style={styles.linkBtn} onPress={() => openUrl(item.mapUrl!)}>
                  <ExternalLink size={14} color={THEME.colors.calm.lavenderDeep} />
                  <Text style={styles.linkText}>{t('emergencyKit.openMap')}</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <TouchableOpacity
              onPress={() => onDelete(item.id)}
              style={styles.deleteBtn}
              accessibilityLabel={t('common.cancel')}
            >
              <Trash2 size={18} color={THEME.colors.text.tertiary} />
            </TouchableOpacity>
          </View>
        ))
      )}

      <TouchableOpacity style={styles.addBtn} onPress={onAdd} activeOpacity={0.8}>
        <Plus size={18} color={THEME.colors.calm.lavenderDeep} />
        <Text style={styles.addText}>{t('emergencyKit.addItem')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: THEME.spacing.sm,
    padding: THEME.spacing.md,
    backgroundColor: THEME.surfaces.elevated.backgroundColor,
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.surfaces.elevated.borderColor,
    ...THEME.shadows.soft,
  },
  header: {
    gap: 4,
  },
  title: {
    ...THEME.typography.h3,
  },
  subtitle: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
  },
  empty: {
    ...THEME.typography.caption,
    color: THEME.colors.text.tertiary,
    fontStyle: 'italic',
  },
  itemCard: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
    padding: THEME.spacing.sm,
    backgroundColor: THEME.surfaces.muted.backgroundColor,
    borderRadius: THEME.borderRadius.standard,
    alignItems: 'flex-start',
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: THEME.borderRadius.standard,
  },
  itemBody: {
    flex: 1,
    gap: 4,
  },
  recommended: {
    ...THEME.typography.small,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
  },
  itemTitle: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
  },
  itemMeta: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.sm,
    marginTop: THEME.spacing.xs,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
  },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  linkText: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
  },
  deleteBtn: {
    padding: 4,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    alignSelf: 'flex-start',
    paddingVertical: THEME.spacing.xs,
  },
  addText: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
  },
});
