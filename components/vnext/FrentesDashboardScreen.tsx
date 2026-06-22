import { View, Text, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useCallback, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { openVaciarCapture } from '@/lib/vaciarNavigation';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { CalmScreen } from '@/components/ui/calm/CalmScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { useFrentesDashboard } from '@/hooks/useFrentesDashboard';
import { FrenteDashboardCard } from '@/components/vnext/FrenteDashboardCard';
import { FrentesWeekInsightCard } from '@/components/vnext/FrentesWeekInsightCard';
import { FrenteDetailSheet } from '@/components/vnext/FrenteDetailSheet';
import { CreateFrenteModal } from '@/components/frentes/CreateFrenteModal';
import type { FrenteDashboardItem } from '@/lib/vnext/buildFrentesDashboard';
import { FrenteChip } from '@/components/frentes/FrenteChip';
import { frontThemeForFront } from '@/lib/frentes/frontTheme';

export function FrentesDashboardScreen() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const { loading, refreshing, dashboard, projects, refresh, getFrontTasks } =
    useFrentesDashboard({ userId: user?.id });

  const [selectedFront, setSelectedFront] = useState<FrenteDashboardItem | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const selectedTasks = useMemo(
    () => (selectedFront ? getFrontTasks(selectedFront.key) : []),
    [getFrontTasks, selectedFront],
  );

  const existingNames = useMemo(() => projects.map((project) => project.name), [projects]);

  const openFront = useCallback((front: FrenteDashboardItem) => {
    setSelectedFront(front);
  }, []);

  const closeFront = useCallback(() => {
    setSelectedFront(null);
  }, []);

  const handleViewTasks = useCallback((front: FrenteDashboardItem) => {
    setSelectedFront(null);
    if (front.projectId) {
      router.push({
        pathname: '/(tabs)/vaciar',
        params: { segment: 'projects', projectId: front.projectId },
      });
      return;
    }
    openVaciarCapture();
  }, []);

  const handleCreated = useCallback(() => {
    void refresh();
  }, [refresh]);

  return (
    <>
      <CalmScreen
        scroll
        topInset="lg"
        gap={THEME.layout.tabSectionGap}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refresh()}
            tintColor={THEME.colors.calm.lavenderDeep}
          />
        }
      >
        <ScreenHeader
          title={t('vnext.frentesDashboardTitle')}
          subtitle={t('vnext.frentesDashboardSub')}
        />

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={THEME.colors.calm.lavenderDeep} />
          </View>
        ) : dashboard.fronts.length === 0 && projects.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🧠</Text>
            <Text style={styles.emptyTitle}>{t('vnext.frentesEmptyTitle')}</Text>
            <Text style={styles.emptySub}>{t('vnext.frentesEmptySub')}</Text>
            <CalmPrimaryButton
              label={t('vnext.frentesEmptyCta')}
              onPress={() => openVaciarCapture()}
              large
            />
          </View>
        ) : (
          <>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>
                {t('vnext.frentesSummary', {
                  fronts: dashboard.fronts.length,
                  tasks: dashboard.totalOpenTasks,
                })}
              </Text>
            </View>

            <View style={styles.grid}>
              {dashboard.fronts.map((front) => (
                <FrenteDashboardCard
                  key={front.key}
                  front={front}
                  onPress={() => openFront(front)}
                />
              ))}
              <FrenteChip
                emoji=""
                name={t('frentes.newFront')}
                theme={frontThemeForFront({ key: 'loose', name: 'loose' })}
                variant="add"
                onPress={() => setCreateOpen(true)}
              />
            </View>

            <FrentesWeekInsightCard bars={dashboard.weekInsight} />
          </>
        )}
      </CalmScreen>

      <FrenteDetailSheet
        visible={Boolean(selectedFront)}
        front={selectedFront}
        tasks={selectedTasks}
        onClose={closeFront}
        onViewTasks={handleViewTasks}
      />

      {user?.id ? (
        <CreateFrenteModal
          visible={createOpen}
          userId={user.id}
          locale={locale}
          existingNames={existingNames}
          onClose={() => setCreateOpen(false)}
          onCreated={handleCreated}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    paddingVertical: THEME.spacing.xl,
    alignItems: 'center',
  },
  empty: {
    alignItems: 'center',
    gap: THEME.spacing.sm,
    paddingVertical: THEME.spacing.lg,
    paddingHorizontal: THEME.spacing.md,
  },
  emptyEmoji: {
    fontSize: 40,
    lineHeight: 48,
  },
  emptyTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    textAlign: 'center',
  },
  emptySub: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: THEME.spacing.sm,
  },
  summaryRow: {
    paddingVertical: 4,
  },
  summaryText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
});
