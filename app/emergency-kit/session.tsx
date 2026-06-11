import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Heart, Sparkles } from 'lucide-react-native';
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
    <CalmScreen topInset="lg" gap={THEME.layout.sectionGapCompact}>
      <EmergencyKitBackHeader
        title={t('emergencyKit.sessionTitle')}
        subtitle={t(`emergencyKit.events.${eventId}`)}
      />

      {ai.crisisMode ? (
        <View style={styles.crisisBanner}>
          <Heart size={18} color={THEME.colors.calm.lavenderDeep} />
          <Text style={styles.crisisText}>{t('emergencyKit.crisisMode')}</Text>
        </View>
      ) : null}

      <View style={styles.supportCard}>
        <View style={styles.supportHeader}>
          <Sparkles size={20} color={THEME.colors.calm.lavenderDeep} />
          <Text style={styles.supportLabel}>{t('emergencyKit.supportMessageTitle')}</Text>
          {ai.fromAi ? (
            <Text style={styles.aiBadge}>{t('emergencyKit.aiPersonalized')}</Text>
          ) : null}
        </View>
        <Text style={styles.supportBody}>{ai.supportMessage}</Text>
      </View>

      {ai.patternInsight ? (
        <View style={styles.insightCard}>
          <Text style={styles.insightLabel}>{t('emergencyKit.patternTitle')}</Text>
          <Text style={styles.insightBody}>{ai.patternInsight}</Text>
        </View>
      ) : null}

      <View style={styles.actionsCard}>
        <Text style={styles.actionsTitle}>{t('emergencyKit.gentleActionsTitle')}</Text>
        {ai.gentleActions.map((action) => (
          <View key={action} style={styles.actionRow}>
            <Text style={styles.actionCheck}>✓</Text>
            <Text style={styles.actionText}>{action}</Text>
          </View>
        ))}
      </View>

      {moduleOrder.map((moduleId) => (
        <EmergencyKitModuleSection
          key={moduleId}
          moduleId={moduleId}
          items={items}
          recommendedIds={ai.recommendedItemIds}
          onAdd={() => setAddModule(moduleId)}
          onDelete={(id) => void deleteItem(id)}
        />
      ))}

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
    ...THEME.surfaces.elevated,
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
    backgroundColor: THEME.surfaces.tinted.backgroundColor,
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    gap: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.surfaces.tinted.borderColor,
  },
  supportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    flexWrap: 'wrap',
  },
  supportLabel: {
    ...THEME.typography.h3,
    flex: 1,
  },
  aiBadge: {
    ...THEME.typography.small,
    color: THEME.colors.calm.lavenderDeep,
  },
  supportBody: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    lineHeight: 24,
  },
  insightCard: {
    backgroundColor: THEME.surfaces.muted.backgroundColor,
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    gap: THEME.spacing.xs,
  },
  insightLabel: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.secondary,
  },
  insightBody: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    lineHeight: 22,
  },
  actionsCard: {
    backgroundColor: THEME.surfaces.elevated.backgroundColor,
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    gap: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.surfaces.elevated.borderColor,
  },
  actionsTitle: {
    ...THEME.typography.h3,
  },
  actionRow: {
    flexDirection: 'row',
    gap: THEME.spacing.xs,
    alignItems: 'flex-start',
  },
  actionCheck: {
    ...THEME.typography.body,
    color: THEME.colors.calm.lavenderDeep,
  },
  actionText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    flex: 1,
    lineHeight: 22,
  },
});
