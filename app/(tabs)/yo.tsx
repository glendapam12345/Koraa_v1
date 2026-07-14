import {
  View,
  Text,
  StyleSheet,
  Alert,
  Platform,
  RefreshControl,
  Share,
  Linking,
} from 'react-native';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { THEME } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { getFirstSessionTourStorageKey } from '@/lib/firstSessionTour';
import { QUICK_ONBOARDING_SEEN_KEY } from '@/lib/quickOnboardingGuide';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  Settings,
  Folder,
  RotateCcw,
  Crown,
  Route,
  LifeBuoy,
  LogOut,
  UserPlus,
  Shield,
  Mail,
} from 'lucide-react-native';
import { logger } from '@/lib/logger';
import { openPaywall } from '@/lib/paywallNavigation';
import { getDisplayName } from '@/lib/displayName';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { useI18n } from '@/contexts/I18nContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CalmScreen } from '@/components/ui/calm/CalmScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { CalmCard } from '@/components/ui/calm/CalmCard';
import Constants from 'expo-constants';
import { useYoProfile } from '@/hooks/useYoProfile';
import { YoEditProfileModal } from '@/components/yo/YoEditProfileModal';
import { YoMenuRow } from '@/components/yo/YoMenuRow';
import { YoSpaceHero } from '@/components/yo/YoSpaceHero';
import { KoraaHowItWorksModal } from '@/components/onboarding/KoraaHowItWorksModal';
import { getPrivacyPolicyUrl, getSupportMailtoUrl, SUPPORT_EMAIL } from '@/constants/legalUrls';

export default function ProfileScreen() {
  const { t, locale } = useI18n();
  const { editProfile: editProfileParam } = useLocalSearchParams<{ editProfile?: string }>();
  const { user, signOut } = useAuth();
  const { isSubscribed, isLoading: subscriptionLoading } = useSubscription();
  const [refreshing, setRefreshing] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showKoraaGuide, setShowKoraaGuide] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

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

  const showPremiumCta = !subscriptionLoading && !isSubscribed;

  const handleSignOut = useCallback(() => {
    Alert.alert(t('yo.signOutConfirmTitle'), t('yo.signOutConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.signOut'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setSigningOut(true);
            try {
              await signOut();
              router.replace('/auth/login');
            } catch (error) {
              logger.error('Error al cerrar sesión:', error);
              Alert.alert(t('yo.signOutErrorTitle'), t('yo.signOutErrorBody'));
            } finally {
              setSigningOut(false);
            }
          })();
        },
      },
    ]);
  }, [signOut, t]);

  const handleInviteFriend = useCallback(async () => {
    const message = t('yo.inviteShareMessage');
    try {
      await Share.share(
        Platform.OS === 'ios'
          ? { message }
          : { message, title: t('yo.inviteFriend') },
      );
    } catch (error) {
      logger.error('Error al compartir invitación:', error);
      Alert.alert(t('yo.inviteErrorTitle'), t('yo.inviteErrorBody'));
    }
  }, [t]);

  const handleOpenPrivacy = useCallback(async () => {
    const url = getPrivacyPolicyUrl();
    try {
      if (Platform.OS === 'web') {
        await Linking.openURL(url);
        return;
      }
      await WebBrowser.openBrowserAsync(url);
    } catch (error) {
      logger.error('Error al abrir privacidad:', error);
      Alert.alert(t('help.openLinkError'), t('help.openLinkHint', { label: t('yo.privacy') }));
    }
  }, [t]);

  const handleOpenSupport = useCallback(async () => {
    const mailto = getSupportMailtoUrl();
    try {
      await Linking.openURL(mailto);
    } catch (error) {
      logger.error('Error al abrir soporte:', error);
      Alert.alert(t('yo.support'), t('yo.supportFallbackBody', { email: SUPPORT_EMAIL }), [
        {
          text: t('yo.copyEmail'),
          onPress: () => {
            void Share.share({ message: SUPPORT_EMAIL }).catch(() => undefined);
          },
        },
        { text: t('errors.ok') },
      ]);
    }
  }, [t]);

  return (
    <View style={styles.container}>
      <CalmScreen
        topInset="md"
        gap={THEME.layout.sectionGapCompact}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void handleRefresh()}
            tintColor={THEME.colors.calm.lavenderDeep}
          />
        }
      >
        <ScreenHeader compact title={t('tabs.profile')} subtitle={t('yo.spaceSubtitle')} />

        <YoSpaceHero
          displayName={displayName}
          email={user?.email}
          avatarLetter={avatarLetter}
          showPremiumBadge={isSubscribed && !subscriptionLoading}
          viewProfileLabel={t('yo.viewProfile')}
          onPress={openEditProfile}
          accessibilityLabel={t('yoExtra.editProfileA11y')}
          accessibilityHint={t('yoExtra.editProfileHint')}
        />

        <CalmCard style={styles.menuCard}>
          {showPremiumCta ? (
            <YoMenuRow
              icon={<Crown size={22} color={THEME.colors.calm.lavenderDeep} />}
              title={t('yo.premiumCta')}
              onPress={() => openPaywall(router, '/(tabs)/yo')}
              accessibilityLabel={t('yo.premiumCta')}
              accessibilityHint={t('yoExtra.subscriptionHint')}
              showDivider
            />
          ) : (
            <YoMenuRow
              icon={<Crown size={22} color={THEME.colors.calm.lavenderDeep} />}
              title={t('yo.subscription')}
              onPress={() => openPaywall(router, '/(tabs)/yo')}
              accessibilityLabel={t('yo.subscription')}
              accessibilityHint={t('yoExtra.subscriptionHint')}
              showDivider
            />
          )}

          <YoMenuRow
            icon={<Settings size={22} color={THEME.colors.calm.lavenderDeep} />}
            title={t('yo.settings')}
            onPress={() => router.push('/settings')}
            accessibilityLabel={t('yo.settings')}
            accessibilityHint={t('yoExtra.settingsHint')}
            showDivider
          />

          <YoMenuRow
            icon={<Folder size={22} color={THEME.colors.calm.lavenderDeep} />}
            title={t('yo.manageProjects')}
            subtitle={t('yo.manageProjectsSub')}
            onPress={() => router.push('/proyectos')}
            accessibilityLabel={t('yoExtra.manageProjectsA11y')}
            accessibilityHint={t('yoExtra.manageProjectsHint')}
            showDivider
          />

          <YoMenuRow
            icon={<Route size={22} color={THEME.colors.calm.lavenderDeep} />}
            title={t('koraaGuide.menuTitle')}
            subtitle={t('koraaGuide.menuSubtitle')}
            onPress={() => setShowKoraaGuide(true)}
            accessibilityLabel={t('koraaGuide.menuA11y')}
            accessibilityHint={t('koraaGuide.menuHint')}
            showDivider
          />

          <YoMenuRow
            icon={<UserPlus size={22} color={THEME.colors.calm.lavenderDeep} />}
            title={t('yo.inviteFriend')}
            onPress={() => void handleInviteFriend()}
            accessibilityLabel={t('yo.inviteFriend')}
            accessibilityHint={t('yo.inviteFriendHint')}
            showDivider
          />

          <YoMenuRow
            icon={<Mail size={22} color={THEME.colors.calm.lavenderDeep} />}
            title={t('yo.support')}
            onPress={() => void handleOpenSupport()}
            accessibilityLabel={t('yo.support')}
            accessibilityHint={t('yo.supportHint')}
            showDivider
          />

          <YoMenuRow
            icon={<Shield size={22} color={THEME.colors.calm.lavenderDeep} />}
            title={t('yo.privacy')}
            onPress={() => void handleOpenPrivacy()}
            accessibilityLabel={t('yo.privacy')}
            accessibilityHint={t('yo.privacyHint')}
            showDivider
          />

          <YoMenuRow
            icon={<LifeBuoy size={22} color={THEME.colors.calm.lavenderDeep} />}
            title={t('yo.help')}
            subtitle={t('yo.helpHint')}
            onPress={() => router.push('/help')}
            accessibilityLabel={t('yo.help')}
            accessibilityHint={t('yo.helpHint')}
            showDivider
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
              showDivider
            />
          ) : null}

          <YoMenuRow
            icon={<LogOut size={22} color={THEME.colors.text.secondary} />}
            title={signingOut ? t('yo.signingOut') : t('settings.signOut')}
            onPress={handleSignOut}
            accessibilityLabel={t('settings.signOut')}
            destructive
          />
        </CalmCard>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {t('yo.versionLabel', {
              version: Constants.expoConfig?.version ?? '1.0.0',
            })}
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
  menuCard: {
    paddingVertical: THEME.spacing.xs,
    paddingHorizontal: 0,
    gap: 0,
    overflow: 'hidden',
  },
  footer: {
    alignItems: 'center',
    paddingTop: THEME.spacing.sm,
    paddingBottom: THEME.spacing.md,
  },
  footerText: {
    ...THEME.typography.small,
    color: THEME.colors.text.tertiary,
  },
});
