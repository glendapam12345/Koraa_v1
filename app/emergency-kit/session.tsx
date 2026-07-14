import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { CalmScreen } from '@/components/ui/calm/CalmScreen';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { EmergencyKitBackHeader } from '@/components/emergencyKit/EmergencyKitBackHeader';
import type {
  EmergencyKitEventId,
  EmergencyKitModuleId,
  EmergencyKitSessionState,
} from '@/lib/emergencyKit/types';
import { EmergencyKitModuleSection } from '@/components/emergencyKit/EmergencyKitModuleSection';
import { EmergencyKitAddItemModal } from '@/components/emergencyKit/EmergencyKitAddItemModal';
import { useEmergencyKit } from '@/hooks/useEmergencyKit';
import { EMERGENCY_KIT_EVENTS } from '@/lib/emergencyKit/events';

function resolveEventId(raw?: string): EmergencyKitEventId {
  if (raw && EMERGENCY_KIT_EVENTS.some((event) => event.id === raw)) {
    return raw as EmergencyKitEventId;
  }
  return 'other';
}

export default function EmergencyKitSessionScreen() {
  const { t } = useI18n();
  const params = useLocalSearchParams<{ eventId?: string; customText?: string }>();
  const eventId = useMemo(() => resolveEventId(params.eventId), [params.eventId]);
  const customText = typeof params.customText === 'string' ? params.customText : undefined;

  const { items, sessionLoading, startSession, addItem, deleteItem } = useEmergencyKit();
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState(false);
  const [response, setResponse] = useState<EmergencyKitSessionState | null>(null);
  const [addModule, setAddModule] = useState<EmergencyKitModuleId | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [modulesOpen, setModulesOpen] = useState(false);
  const [insightOpen, setInsightOpen] = useState(false);

  const loadSession = useCallback(async () => {
    setSessionError(false);
    setSessionReady(false);
    try {
      const session = await startSession(eventId, customText || undefined);
      if (!session?.response) {
        setSessionError(true);
        setResponse(null);
      } else {
        setResponse(session);
      }
    } catch {
      setSessionError(true);
      setResponse(null);
    } finally {
      setSessionReady(true);
    }
  }, [startSession, eventId, customText]);

  useEffect(() => {
    void loadSession();
  }, [loadSession, loadAttempt]);

  const ai = response?.response;
  const moduleOrder = useMemo(
    () => ai?.prioritizedModules ?? [],
    [ai?.prioritizedModules],
  );
  const primaryModule = moduleOrder[0];
  const extraModules = moduleOrder.slice(1);

  if (!sessionReady || sessionLoading) {
    return (
      <CalmScreen topInset="lg">
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={THEME.colors.calm.lavenderDeep} />
          <Text style={styles.loadingText}>{t('emergencyKit.sessionLoading')}</Text>
        </View>
      </CalmScreen>
    );
  }

  if (sessionError || !ai) {
    return (
      <CalmScreen topInset="lg" gap={THEME.layout.sectionGapCompact}>
        <EmergencyKitBackHeader
          title={t('emergencyKit.sessionTitle')}
          subtitle={t(`emergencyKit.events.${eventId}`)}
        />
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>{t('emergencyKit.sessionErrorTitle')}</Text>
          <Text style={styles.errorBody}>{t('emergencyKit.sessionErrorBody')}</Text>
        </View>
        <CalmPrimaryButton
          label={t('emergencyKit.sessionRetry')}
          onPress={() => setLoadAttempt((n) => n + 1)}
          variant="default"
        />
        <CalmPrimaryButton
          label={t('emergencyKit.sessionGoBack')}
          onPress={() => router.back()}
          variant="soft"
        />
      </CalmScreen>
    );
  }

  return (
    <CalmScreen topInset="md" gap={THEME.layout.sectionGapCompact}>
      <EmergencyKitBackHeader
        title={t('emergencyKit.sessionTitle')}
        subtitle={t(`emergencyKit.events.${eventId}`)}
      />

      <TouchableOpacity
        onPress={() => router.push('/emergency-kit')}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={t('emergencyKit.changeSituation')}
        accessibilityHint={t('emergencyKit.changeSituationHint')}
        style={styles.changeLink}
      >
        <Text style={styles.changeLinkText}>{t('emergencyKit.changeSituation')}</Text>
      </TouchableOpacity>

      {ai.crisisMode ? (
        <View style={styles.crisisBanner}>
          <Heart size={18} color={THEME.colors.calm.lavenderDeep} />
          <Text style={styles.crisisText}>{t('emergencyKit.crisisMode')}</Text>
        </View>
      ) : null}

      <View style={styles.supportCard}>
        <Text style={styles.supportLabel}>{t('emergencyKit.supportMessageTitle')}</Text>
        {ai.fromAi ? <Text style={styles.aiBadge}>{t('emergencyKit.aiPersonalized')}</Text> : null}
        <Text style={styles.supportBody}>{ai.supportMessage}</Text>
      </View>

      <View style={styles.actionsCard}>
        <Text style={styles.actionsTitle}>{t('emergencyKit.gentleActionsTitle')}</Text>
        {ai.gentleActions.map((action) => (
          <View key={action} style={styles.actionRow}>
            <Text style={styles.actionBullet}>·</Text>
            <Text style={styles.actionText}>{action}</Text>
          </View>
        ))}
      </View>

      {ai.patternInsight ? (
        <>
          {!insightOpen ? (
            <TouchableOpacity
              style={styles.softToggle}
              onPress={() => setInsightOpen(true)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t('emergencyKit.patternTitle')}
            >
              <Text style={styles.softToggleText}>{t('emergencyKit.patternTitle')}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.insightCard}>
              <Text style={styles.insightLabel}>{t('emergencyKit.patternTitle')}</Text>
              <Text style={styles.insightBody}>{ai.patternInsight}</Text>
              <TouchableOpacity
                onPress={() => setInsightOpen(false)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={t('emergencyKit.modulesHide')}
              >
                <Text style={styles.softToggleText}>{t('emergencyKit.modulesHide')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      ) : null}

      {primaryModule ? (
        <EmergencyKitModuleSection
          moduleId={primaryModule}
          items={items}
          recommendedIds={ai.recommendedItemIds}
          onAdd={() => setAddModule(primaryModule)}
          onDelete={(id) => void deleteItem(id)}
        />
      ) : null}

      {extraModules.length > 0 ? (
        <>
          {!modulesOpen ? (
            <TouchableOpacity
              style={styles.softToggle}
              onPress={() => setModulesOpen(true)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t('emergencyKit.modulesMore', { count: extraModules.length })}
            >
              <Text style={styles.softToggleText}>
                {t('emergencyKit.modulesMore', { count: extraModules.length })}
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={styles.softToggle}
                onPress={() => setModulesOpen(false)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={t('emergencyKit.modulesHide')}
              >
                <Text style={styles.softToggleText}>{t('emergencyKit.modulesHide')}</Text>
              </TouchableOpacity>
              {extraModules.map((moduleId) => (
                <EmergencyKitModuleSection
                  key={moduleId}
                  moduleId={moduleId}
                  items={items}
                  recommendedIds={ai.recommendedItemIds}
                  onAdd={() => setAddModule(moduleId)}
                  onDelete={(id) => void deleteItem(id)}
                />
              ))}
            </>
          )}
        </>
      ) : null}

      {addModule ? (
        <EmergencyKitAddItemModal
          visible={!!addModule}
          moduleId={addModule}
          eventId={eventId}
          onClose={() => setAddModule(null)}
          onSave={(item) => void addItem(item)}
        />
      ) : null}
    </CalmScreen>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.sm,
    paddingTop: 80,
  },
  loadingText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
  },
  errorCard: {
    backgroundColor: THEME.colors.calm.mist,
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    padding: THEME.spacing.md,
    gap: THEME.spacing.xs,
  },
  errorTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
  },
  errorBody: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
  },
  crisisBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    backgroundColor: THEME.colors.calm.lavender,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.rounded,
  },
  crisisText: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    flex: 1,
    lineHeight: 20,
  },
  supportCard: {
    backgroundColor: THEME.colors.calm.mist,
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    gap: THEME.spacing.xs,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  supportLabel: {
    ...THEME.typography.meta,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
  },
  aiBadge: {
    ...THEME.typography.small,
    color: THEME.colors.text.tertiary,
  },
  supportBody: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    lineHeight: 24,
  },
  insightCard: {
    backgroundColor: THEME.colors.calm.mist,
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    gap: THEME.spacing.xs,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  insightLabel: {
    ...THEME.typography.meta,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.calm.lavenderDeep,
  },
  insightBody: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    lineHeight: 22,
  },
  actionsCard: {
    backgroundColor: THEME.colors.calm.card,
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    gap: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  actionsTitle: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  actionRow: {
    flexDirection: 'row',
    gap: THEME.spacing.xs,
    alignItems: 'flex-start',
  },
  actionBullet: {
    ...THEME.typography.body,
    color: THEME.colors.calm.lavenderDeep,
    lineHeight: 22,
  },
  actionText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    flex: 1,
    lineHeight: 22,
  },
  changeLink: {
    alignSelf: 'flex-start',
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
  },
  changeLinkText: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.calm.lavenderDeep,
  },
  softToggle: {
    alignSelf: 'center',
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
    paddingHorizontal: THEME.spacing.md,
  },
  softToggleText: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.calm.lavenderDeep,
    textAlign: 'center',
  },
});
