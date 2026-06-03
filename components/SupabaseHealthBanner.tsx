import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { AlertCircle, RefreshCw } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { SchemaSetupType } from '@/lib/supabase';
import type { SupabaseHealthStatus } from '@/hooks/useSupabaseHealth';
import {
  isSupabaseHealthDevDetail,
  shouldShowSupabaseHealthBanner,
} from '@/lib/supabaseHealthBannerMode';

type SupabaseHealthBannerProps = {
  status: SupabaseHealthStatus;
  primarySchemaIssue: SchemaSetupType | null;
  connectionDetail?: string;
  onRefresh: () => void;
};

export function SupabaseHealthBanner({
  status,
  primarySchemaIssue,
  connectionDetail,
  onRefresh,
}: SupabaseHealthBannerProps) {
  const { t } = useI18n();
  const showDevDetail = isSupabaseHealthDevDetail();

  if (!shouldShowSupabaseHealthBanner(status)) {
    return null;
  }

  const titleKey = showDevDetail
    ? status === 'missing_config'
      ? 'supabaseHealth.missingConfigTitle'
      : status === 'unreachable'
        ? 'supabaseHealth.unreachableTitle'
        : status === 'config_mismatch'
          ? 'supabaseHealth.mismatchTitle'
          : status === 'schema_incomplete'
            ? 'supabaseHealth.schemaTitle'
            : 'supabaseHealth.syncTitle'
    : 'supabaseHealth.syncTitle';

  const body = showDevDetail
    ? status === 'missing_config'
      ? t('supabaseHealth.missingConfigBody')
      : status === 'unreachable'
        ? t('supabaseHealth.unreachableBody')
        : status === 'config_mismatch'
          ? t('supabaseHealth.mismatchBody')
          : status === 'schema_incomplete'
            ? primarySchemaIssue === 'scheduled_date'
              ? t('semanaExtra.setupScheduledDate')
              : primarySchemaIssue === 'projects_table'
                ? t('semanaExtra.setupProjectsTable')
                : primarySchemaIssue === 'project_id'
                  ? t('semanaExtra.setupProjectId')
                  : t('semanaExtra.setupGeneric')
            : t('supabaseHealth.syncBody')
    : t('supabaseHealth.syncBody');

  const showSchemaDevHints = showDevDetail && status === 'schema_incomplete';
  const showMismatchHint = showDevDetail && status === 'config_mismatch';
  const showHelpCta =
    showDevDetail && (status === 'schema_incomplete' || status === 'missing_config');

  return (
    <View style={styles.wrap} accessibilityRole="alert">
      <View style={styles.row}>
        <AlertCircle size={20} color={THEME.colors.gradient.blue} />
        <View style={styles.textCol}>
          <Text style={styles.title}>{t(titleKey)}</Text>
          <Text style={styles.body}>{body}</Text>
          {showDevDetail && connectionDetail ? (
            <Text style={styles.devDetail}>{connectionDetail}</Text>
          ) : null}
          {showSchemaDevHints ? (
            <>
              <Text style={styles.hint}>{t('supabaseHealth.schemaHint')}</Text>
              <Text style={styles.steps}>{t('semanaExtra.setupSteps')}</Text>
            </>
          ) : null}
          {showMismatchHint ? (
            <Text style={styles.hint}>{t('supabaseHealth.mismatchHint')}</Text>
          ) : null}
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => void onRefresh()}
          style={styles.btn}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={t('supabaseHealth.refreshA11y')}
        >
          <RefreshCw size={16} color={THEME.colors.gradient.blue} />
          <Text style={styles.btnText}>{t('boot.retry')}</Text>
        </TouchableOpacity>
        {showHelpCta ? (
          <TouchableOpacity
            onPress={() => router.push('/help')}
            style={styles.btn}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('supabaseHealth.helpA11y')}
          >
            <Text style={styles.btnText}>{t('supabaseHealth.helpCta')}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    marginBottom: 4,
  },
  body: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
  },
  devDetail: {
    ...THEME.typography.meta,
    color: THEME.colors.text.tertiary,
    marginTop: THEME.spacing.xs,
    fontFamily: 'monospace',
  },
  hint: {
    ...THEME.typography.meta,
    color: THEME.colors.gradient.blue,
    marginTop: THEME.spacing.xs,
    lineHeight: 18,
  },
  steps: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.sm,
    marginTop: THEME.spacing.sm,
    paddingTop: THEME.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.tint.blue.border,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: THEME.spacing.sm,
  },
  btnText: {
    ...THEME.typography.caption,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
  },
});
