import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { THEME } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { getFirstSessionTourStorageKey } from '@/lib/firstSessionTour';
import { QUICK_ONBOARDING_SEEN_KEY } from '@/lib/quickOnboardingGuide';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  Settings,
  Edit,
  Folder,
  RotateCcw,
  Crown,
  ChevronRight,
  Route,
} from 'lucide-react-native';
import { logger } from '@/lib/logger';
import { openPaywall } from '@/lib/paywallNavigation';
import { getDisplayName } from '@/lib/displayName';
import * as Haptics from 'expo-haptics';
import { useI18n } from '@/contexts/I18nContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CalmScreen } from '@/components/ui/calm/CalmScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { CalmCard } from '@/components/ui/calm/CalmCard';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import Constants from 'expo-constants';
import { useYoProfile } from '@/hooks/useYoProfile';
import { YoEditProfileModal } from '@/components/yo/YoEditProfileModal';
import { YoMenuRow } from '@/components/yo/YoMenuRow';
import { KoraaHowItWorksModal } from '@/components/onboarding/KoraaHowItWorksModal';

export default function ProfileScreen() {
  const { t, locale } = useI18n();
  const { editProfile: editProfileParam } = useLocalSearchParams<{ editProfile?: string }>();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showKoraaGuide, setShowKoraaGuide] = useState(false);

  const profileState = useYoProfile({
    userId: user?.id,
    userEmail: user?.email,
    userMetadata: user?.user_metadata,
    locale,
    t,
  });

  const {
    profile,
    fullNameInput,
    setFullNameInput,
    ageInput,
    newActivity,
    setNewActivity,
    newInterest,
    setNewInterest,
    isSavingProfile,
    profileError,
    loadProfile,
    addActivity,
    removeActivity,
    addInterest,
    removeInterest,
    handleAgeInputChange,
    handleSaveProfile,
    beginEditProfile,
    clearProfileError,
  } = profileState;

  const openEditProfile = useCallback(() => {
    beginEditProfile();
    setShowEditProfile(true);
  }, [beginEditProfile]);

  useEffect(() => {
    if (editProfileParam !== '1') return;
    openEditProfile();
    router.setParams({ editProfile: undefined });
  }, [editProfileParam, openEditProfile]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile]),
  );

  const displayName = useMemo(
    () =>
      getDisplayName(
        { full_name: profile.full_name, user_metadata: user?.user_metadata },
        t('yo.welcomeName'),
      ),
    [profile.full_name, user?.user_metadata, t],
  );

  const needsNamePrompt = useMemo(() => {
    const fromProfile = profile.full_name?.trim();
    const fromMeta =
      typeof user?.user_metadata?.full_name === 'string'
        ? user.user_metadata.full_name.trim()
        : '';
    return !fromProfile && !fromMeta;
  }, [profile.full_name, user?.user_metadata?.full_name]);

  const avatarLetter = useMemo(() => {
    const fromProfile = profile.full_name?.trim();
    const fromMeta =
      typeof user?.user_metadata?.full_name === 'string' ? user.user_metadata.full_name.trim() : '';
    const base = fromProfile || fromMeta;
    if (base) return base[0]!.toUpperCase();
    return user?.email?.[0]?.toUpperCase() ?? 'K';
  }, [profile.full_name, user?.user_metadata?.full_name, user?.email]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadProfile();
    } catch (error) {
      logger.error('Error al refrescar:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const closeEditProfile = () => {
    if (!isSavingProfile) {
      setShowEditProfile(false);
      clearProfileError();
    }
  };

  return (
    <View style={styles.container}>
      <CalmScreen
        topInset="lg"
        gap={THEME.layout.tabSectionGap}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void handleRefresh()}
            tintColor={THEME.colors.calm.lavenderDeep}
          />
        }
      >
        <ScreenHeader title={t('tabs.profile')} subtitle={t('yo.spaceSubtitle')} />

        <CalmCard>
          <TouchableOpacity
            style={styles.header}
            onPress={openEditProfile}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={t('yoExtra.editProfileA11y')}
            accessibilityHint={t('yoExtra.editProfileHint')}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{avatarLetter}</Text>
            </View>
            <View style={styles.headerText}>
              <Text style={styles.name}>{displayName}</Text>
              <Text style={styles.email} numberOfLines={1}>
                {user?.email}
              </Text>
              <Text style={styles.headerEditHintText}>{t('yo.tapToEdit')}</Text>
            </View>
            <ChevronRight size={20} color={THEME.colors.text.tertiary} />
          </TouchableOpacity>
        </CalmCard>

        {needsNamePrompt ? (
          <CalmCard style={styles.namePromptCard}>
            <Text style={styles.namePromptTitle}>{t('yo.namePromptTitle')}</Text>
            <Text style={styles.namePromptBody}>{t('yo.namePromptBody')}</Text>
            <CalmPrimaryButton
              label={t('yo.namePromptCta')}
              onPress={openEditProfile}
              variant="soft"
              accessibilityLabel={t('yo.namePromptCta')}
            />
          </CalmCard>
        ) : null}

        <CalmCard style={styles.menuCard}>
          <YoMenuRow
            icon={<Edit size={22} color={THEME.colors.calm.lavenderDeep} />}
            title={t('yo.editProfile')}
            onPress={openEditProfile}
            accessibilityLabel={t('yoExtra.editProfileA11y')}
            accessibilityHint={t('yoExtra.editProfileMenuHint', {
              activities: profile.favorite_activities?.length || 0,
              interests: profile.interests?.length || 0,
            })}
          />
          <YoMenuRow
            icon={<Folder size={22} color={THEME.colors.calm.lavenderDeep} />}
            title={t('yo.manageProjects')}
            onPress={() => router.push('/proyectos')}
            accessibilityLabel={t('yoExtra.manageProjectsA11y')}
            accessibilityHint={t('yoExtra.manageProjectsHint')}
          />
          <YoMenuRow
            icon={<Crown size={22} color={THEME.colors.calm.lavenderDeep} />}
            title={t('yo.subscription')}
            subtitle={t('yo.subscriptionSub')}
            onPress={() => openPaywall(router, '/(tabs)/yo')}
            accessibilityLabel={t('yo.subscription')}
            accessibilityHint={t('yoExtra.subscriptionHint')}
          />
          <View style={styles.menuDivider} />
          <YoMenuRow
            icon={<Route size={22} color={THEME.colors.calm.lavenderDeep} />}
            title={t('koraaGuide.menuTitle')}
            subtitle={t('koraaGuide.menuSubtitle')}
            onPress={() => setShowKoraaGuide(true)}
            accessibilityLabel={t('koraaGuide.menuA11y')}
            accessibilityHint={t('koraaGuide.menuHint')}
          />
          <YoMenuRow
            icon={<Settings size={22} color={THEME.colors.calm.lavenderDeep} />}
            title={t('yo.settings')}
            subtitle={t('yo.settingsSub')}
            onPress={() => router.push('/settings')}
            accessibilityLabel={t('yo.settings')}
            accessibilityHint={t('yoExtra.settingsHint')}
          />
          {__DEV__ ? (
            <YoMenuRow
              icon={<RotateCcw size={22} color={THEME.colors.text.secondary} />}
              title={t('yo.devResetLabel')}
              subtitle={t('yo.devResetSub')}
              onPress={async () => {
                try {
                  await AsyncStorage.removeItem(QUICK_ONBOARDING_SEEN_KEY);
                  if (user?.id) {
                    await AsyncStorage.removeItem(getFirstSessionTourStorageKey(user.id));
                  }
                  Alert.alert(t('yo.devResetTitle'), t('yo.devResetBody'), [
                    { text: t('errors.ok') },
                  ]);
                  if (Platform.OS !== 'web') {
                    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }
                } catch (error) {
                  logger.error('Error reseteando onboarding:', error);
                  Alert.alert(
                    t('yoExtra.resetOnboardingError'),
                    t('yoExtra.resetOnboardingErrorBody'),
                  );
                }
              }}
              accessibilityLabel={t('yoExtra.devResetA11y')}
              accessibilityHint={t('yoExtra.devResetHint')}
            />
          ) : null}
        </CalmCard>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Koraa v{Constants.expoConfig?.version ?? '1.0.0'}</Text>
          <Text style={styles.footerSubtext}>
            {t('yo.footerTagline')}{' '}
            <Text style={styles.footerAccent}>{t('yo.footerAccent')}</Text>
            {'\n'}
            {t('yo.footerTaglineEnd')}
          </Text>
        </View>
      </CalmScreen>

      <YoEditProfileModal
        visible={showEditProfile}
        onClose={closeEditProfile}
        profile={profile}
        fullNameInput={fullNameInput}
        onFullNameChange={setFullNameInput}
        ageInput={ageInput}
        onAgeChange={handleAgeInputChange}
        newActivity={newActivity}
        onNewActivityChange={setNewActivity}
        newInterest={newInterest}
        onNewInterestChange={setNewInterest}
        isSavingProfile={isSavingProfile}
        profileError={profileError}
        onAddActivity={addActivity}
        onRemoveActivity={removeActivity}
        onAddInterest={addInterest}
        onRemoveInterest={removeInterest}
        onSave={handleSaveProfile}
      />

      <KoraaHowItWorksModal
        visible={showKoraaGuide}
        onClose={() => setShowKoraaGuide(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.calm.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.md,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: THEME.borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.calm.lavender,
  },
  avatarText: {
    ...THEME.typography.titleCompact,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
  name: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  email: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
  },
  headerEditHintText: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
  },
  namePromptCard: {
    gap: THEME.spacing.sm,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    borderColor: THEME.colors.tint.blue.border,
    borderWidth: 1,
  },
  namePromptTitle: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  namePromptBody: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
  },
  menuCard: {
    paddingVertical: THEME.spacing.xs,
    paddingHorizontal: 0,
    gap: 0,
  },
  menuDivider: {
    height: 1,
    backgroundColor: THEME.colors.calm.border,
    marginHorizontal: THEME.spacing.md,
  },
  footer: {
    alignItems: 'center',
    paddingTop: THEME.spacing.sm,
  },
  footerText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.xs,
  },
  footerSubtext: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  footerAccent: {
    fontFamily: THEME.fonts.accent.italic,
  },
});
