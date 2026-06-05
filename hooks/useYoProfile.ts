import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { fetchProfilePreferences } from '@/lib/profilePreferences';
import { logger } from '@/lib/logger';
import { getErrorMessage } from '@/lib/supabase';
import { track } from '@/lib/analytics';
import type { AppLocale } from '@/lib/i18n';

export type YoUserProfile = {
  full_name?: string;
  age?: number;
  favorite_activities?: string[];
  interests?: string[];
  other_preferences?: Record<string, unknown>;
};

const MAX_PROFILE_ITEMS = 25;
const MAX_ITEM_LENGTH = 50;

type UseYoProfileOptions = {
  userId: string | undefined;
  userMetadata: Record<string, unknown> | undefined;
  locale: AppLocale;
  t: (key: string, params?: Record<string, string | number>) => string;
  showEditProfile: boolean;
};

export function useYoProfile({
  userId,
  userMetadata,
  locale,
  t,
  showEditProfile,
}: UseYoProfileOptions) {
  const [profile, setProfile] = useState<YoUserProfile>({});
  const [fullNameInput, setFullNameInput] = useState('');
  const [ageInput, setAgeInput] = useState('');
  const [newActivity, setNewActivity] = useState('');
  const [newInterest, setNewInterest] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await fetchProfilePreferences(userId);

      if (error) {
        logger.error('Error cargando perfil:', error);
        const errorMessage = getErrorMessage(error, locale);
        const friendlyMessage =
          errorMessage === t('supabaseErrors.noConnection')
            ? t('yo.profileLoadOffline')
            : t('yo.profileLoadError');
        setProfileError(friendlyMessage);
        return;
      }

      if (data) {
        setProfile({
          full_name: data.full_name?.trim() || undefined,
          age: data.age ?? undefined,
          favorite_activities: data.favorite_activities,
          interests: data.interests,
          other_preferences: data.other_preferences,
        });
        setAgeInput(data.age != null ? String(data.age) : '');
        setProfileError(null);
      }
    } catch (error) {
      logger.error('Error inesperado:', error);
      setProfileError(t('yo.profileLoadError'));
    }
  }, [userId, locale, t]);

  useEffect(() => {
    if (!showEditProfile) return;
    const fromProfile = profile.full_name?.trim() ?? '';
    const fromMeta =
      typeof userMetadata?.full_name === 'string' ? userMetadata.full_name.trim() : '';
    setFullNameInput(fromProfile || fromMeta);
  }, [showEditProfile, profile.full_name, userMetadata?.full_name]);

  const addActivity = useCallback(() => {
    const trimmedActivity = newActivity.trim();
    if (!trimmedActivity) return;

    if ((profile.favorite_activities || []).length >= MAX_PROFILE_ITEMS) {
      Alert.alert(t('yo.limitReachedTitle'), t('yo.limitActivities', { max: MAX_PROFILE_ITEMS }));
      return;
    }
    if (trimmedActivity.length > MAX_ITEM_LENGTH) {
      Alert.alert(t('yo.tooLongTitle'), t('yo.activityTooLong'));
      return;
    }

    const existing = (profile.favorite_activities || []).map((a) => a.toLowerCase());
    if (existing.includes(trimmedActivity.toLowerCase())) {
      Alert.alert(t('yo.duplicateTitle'), t('yo.duplicateActivity'));
      return;
    }

    setProfile({
      ...profile,
      favorite_activities: [...(profile.favorite_activities || []), trimmedActivity],
    });
    setNewActivity('');
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [newActivity, profile, t]);

  const removeActivity = useCallback(
    (index: number) => {
      const updated = [...(profile.favorite_activities || [])];
      updated.splice(index, 1);
      setProfile({ ...profile, favorite_activities: updated });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [profile],
  );

  const addInterest = useCallback(() => {
    const trimmedInterest = newInterest.trim();
    if (!trimmedInterest) return;

    if ((profile.interests || []).length >= MAX_PROFILE_ITEMS) {
      Alert.alert(t('yo.limitReachedTitle'), t('yo.limitInterests', { max: MAX_PROFILE_ITEMS }));
      return;
    }
    if (trimmedInterest.length > MAX_ITEM_LENGTH) {
      Alert.alert(t('yo.tooLongTitle'), t('yo.interestTooLong'));
      return;
    }

    const existing = (profile.interests || []).map((i) => i.toLowerCase());
    if (existing.includes(trimmedInterest.toLowerCase())) {
      Alert.alert(t('yo.duplicateTitle'), t('yo.duplicateInterest'));
      return;
    }

    setProfile({
      ...profile,
      interests: [...(profile.interests || []), trimmedInterest],
    });
    setNewInterest('');
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [newInterest, profile, t]);

  const removeInterest = useCallback(
    (index: number) => {
      const updated = [...(profile.interests || [])];
      updated.splice(index, 1);
      setProfile({ ...profile, interests: updated });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [profile],
  );

  const handleAgeInputChange = useCallback(
    (text: string) => {
      const numericText = text.replace(/[^0-9]/g, '');
      if (numericText === '') {
        setAgeInput('');
        return;
      }

      const age = parseInt(numericText, 10);
      if (age >= 13 && age <= 120) {
        setAgeInput(numericText);
      } else if (age > 120) {
        Alert.alert(t('yo.invalidAgeTitle'), t('yo.invalidAgeBody'));
        setAgeInput('120');
      } else if (age < 13 && numericText.length > 0) {
        if (numericText.length === 1) {
          if (age >= 1) setAgeInput(numericText);
          else setAgeInput('');
        } else {
          Alert.alert(t('yo.invalidAgeTitle'), t('yo.invalidAgeBody'));
          setAgeInput('13');
        }
      }
    },
    [t],
  );

  const handleSaveProfile = useCallback(async () => {
    if (!userId) return;

    setIsSavingProfile(true);
    setProfileError(null);

    try {
      let ageValue: number | undefined;
      if (ageInput.trim()) {
        const parsedAge = parseInt(ageInput.trim(), 10);
        if (isNaN(parsedAge) || parsedAge < 13 || parsedAge > 120) {
          setProfileError(t('yo.invalidAgeBody'));
          return false;
        }
        ageValue = parsedAge;
      }

      const trimmedDisplayName = fullNameInput.trim();

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: trimmedDisplayName || null,
          age: ageValue,
          favorite_activities: profile.favorite_activities || [],
          interests: profile.interests || [],
        })
        .eq('id', userId);

      if (error) {
        logger.error('Error guardando perfil:', error);
        const missingCol =
          (error as { code?: string; message?: string }).code === '42703' ||
          (typeof (error as { message?: string }).message === 'string' &&
            (error as { message: string }).message.includes('does not exist'));
        setProfileError(missingCol ? t('yo.profileSaveSchemaError') : t('yo.profileSaveError'));
        return false;
      }

      const { error: metaErr } = await supabase.auth.updateUser({
        data: { full_name: trimmedDisplayName },
      });
      if (metaErr) {
        logger.warn('Nombre guardado en perfil; no se pudo sincronizar en la sesión:', metaErr);
      }

      await loadProfile();
      void track('profile_saved', {
        activities_count: profile.favorite_activities?.length ?? 0,
        interests_count: profile.interests?.length ?? 0,
      });
      Alert.alert(t('yo.profileSavedTitle'), t('yo.profileSavedBody'));
      return true;
    } catch (error) {
      logger.error('Error inesperado:', error);
      setProfileError(t('yo.profileSaveUnexpected'));
      return false;
    } finally {
      setIsSavingProfile(false);
    }
  }, [userId, ageInput, fullNameInput, profile, loadProfile, t]);

  const clearProfileError = useCallback(() => setProfileError(null), []);

  return {
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
    clearProfileError,
  };
}
