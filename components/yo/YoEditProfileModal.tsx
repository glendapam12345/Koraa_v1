import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { X, Plus } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { useI18n } from '@/contexts/I18nContext';
import type { YoUserProfile } from '@/hooks/useYoProfile';

const WINDOW_H = Dimensions.get('window').height;
const PROFILE_MODAL_SCROLL_MAX = Math.min(WINDOW_H * 0.58, 520);

type YoEditProfileModalProps = {
  visible: boolean;
  onClose: () => void;
  profile: YoUserProfile;
  fullNameInput: string;
  onFullNameChange: (value: string) => void;
  ageInput: string;
  onAgeChange: (value: string) => void;
  newActivity: string;
  onNewActivityChange: (value: string) => void;
  newInterest: string;
  onNewInterestChange: (value: string) => void;
  isSavingProfile: boolean;
  profileError: string | null;
  onAddActivity: () => void;
  onRemoveActivity: (index: number) => void;
  onAddInterest: () => void;
  onRemoveInterest: (index: number) => void;
  onSave: () => Promise<boolean | undefined>;
};

export function YoEditProfileModal({
  visible,
  onClose,
  profile,
  fullNameInput,
  onFullNameChange,
  ageInput,
  onAgeChange,
  newActivity,
  onNewActivityChange,
  newInterest,
  onNewInterestChange,
  isSavingProfile,
  profileError,
  onAddActivity,
  onRemoveActivity,
  onAddInterest,
  onRemoveInterest,
  onSave,
}: YoEditProfileModalProps) {
  const { t } = useI18n();

  const handleClose = () => {
    if (!isSavingProfile) onClose();
  };

  const handleSave = async () => {
    const saved = await onSave();
    if (saved) onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      accessibilityViewIsModal
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalKeyboardView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('yoExtra.profileModalTitle')}</Text>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.modalCloseButton}
                disabled={isSavingProfile}
                accessibilityRole="button"
                accessibilityLabel={t('yoExtra.closeModalA11y')}
                accessibilityHint={t('yoExtra.closeModalHint')}
                accessibilityState={{ disabled: isSavingProfile }}
              >
                <X size={24} color={THEME.colors.text.main} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              style={[styles.modalScrollView, { maxHeight: PROFILE_MODAL_SCROLL_MAX }]}
              contentContainerStyle={styles.modalScrollContent}
              nestedScrollEnabled
            >
              <Text style={styles.modalIntro}>{t('yoExtra.profileModalIntro')}</Text>

              {profileError ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText} accessibilityRole="alert">
                    {profileError}
                  </Text>
                </View>
              ) : null}

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>{t('yoExtra.yourNameLabel')}</Text>
                <TextInput
                  style={styles.formInput}
                  value={fullNameInput}
                  onChangeText={onFullNameChange}
                  placeholder={t('yoExtra.namePlaceholder')}
                  placeholderTextColor={THEME.colors.text.secondary}
                  autoCapitalize="words"
                  autoCorrect
                  editable={!isSavingProfile}
                  maxLength={80}
                  accessibilityLabel={t('yoExtra.yourNameA11y')}
                  accessibilityHint={t('yoExtra.yourNameHint')}
                />
                <Text style={styles.formHelpInline}>{t('yoExtra.nameHelp')}</Text>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>{t('yoExtra.ageLabel')}</Text>
                <TextInput
                  style={styles.formInput}
                  value={ageInput}
                  onChangeText={onAgeChange}
                  placeholder={t('yoExtra.agePlaceholder')}
                  placeholderTextColor={THEME.colors.text.secondary}
                  keyboardType="number-pad"
                  editable={!isSavingProfile}
                  maxLength={3}
                />
                <Text style={styles.formHelpInline}>{t('yoExtra.ageHelp')}</Text>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>{t('yoExtra.activitiesLabel')}</Text>
                {(profile.favorite_activities || []).length === 0 ? (
                  <Text style={styles.emptyListText}>{t('yoExtra.activitiesEmpty')}</Text>
                ) : (
                  <View style={styles.chipContainer}>
                    {(profile.favorite_activities || []).map((activity, index) => (
                      <View key={`${activity}-${index}`} style={styles.chip}>
                        <Text style={styles.chipText}>{activity}</Text>
                        <TouchableOpacity
                          onPress={() => onRemoveActivity(index)}
                          style={styles.chipRemove}
                          accessibilityRole="button"
                          accessibilityLabel={t('yoExtra.removeActivityA11y', { name: activity })}
                          accessibilityHint={t('yoExtra.removeActivityHint')}
                        >
                          <X size={14} color={THEME.colors.text.secondary} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
                <View style={styles.addInputContainer}>
                  <TextInput
                    style={styles.addInput}
                    value={newActivity}
                    onChangeText={onNewActivityChange}
                    placeholder={t('yoExtra.activitiesPlaceholder')}
                    placeholderTextColor={THEME.colors.text.secondary}
                    onSubmitEditing={onAddActivity}
                    editable={!isSavingProfile}
                    maxLength={50}
                    accessibilityLabel={t('yoExtra.addActivityFieldA11y')}
                    accessibilityHint={t('yoExtra.addActivityFieldHint')}
                  />
                  <TouchableOpacity
                    style={[
                      styles.addButton,
                      (!newActivity.trim() || isSavingProfile) && styles.addButtonDisabled,
                    ]}
                    onPress={onAddActivity}
                    disabled={!newActivity.trim() || isSavingProfile}
                    accessibilityRole="button"
                    accessibilityLabel={t('yoExtra.addActivityA11y')}
                    accessibilityHint={t('yoExtra.addActivityHint')}
                    accessibilityState={{ disabled: !newActivity.trim() || isSavingProfile }}
                  >
                    <Plus size={20} color={THEME.colors.onGradient} />
                  </TouchableOpacity>
                </View>
                {newActivity.length > 40 ? (
                  <Text style={styles.lengthWarning}>
                    {t('yoExtra.charsRemaining', { count: 50 - newActivity.length })}
                  </Text>
                ) : null}
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>{t('yoExtra.interestsLabel')}</Text>
                {(profile.interests || []).length === 0 ? (
                  <Text style={styles.emptyListText}>{t('yoExtra.interestsEmpty')}</Text>
                ) : (
                  <View style={styles.chipContainer}>
                    {(profile.interests || []).map((interest, index) => (
                      <View key={`${interest}-${index}`} style={styles.chip}>
                        <Text style={styles.chipText}>{interest}</Text>
                        <TouchableOpacity
                          onPress={() => onRemoveInterest(index)}
                          style={styles.chipRemove}
                          accessibilityRole="button"
                          accessibilityLabel={t('yoExtra.removeInterestA11y', { name: interest })}
                          accessibilityHint={t('yoExtra.removeInterestHint')}
                        >
                          <X size={14} color={THEME.colors.text.secondary} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
                <View style={styles.addInputContainer}>
                  <TextInput
                    style={styles.addInput}
                    value={newInterest}
                    onChangeText={onNewInterestChange}
                    placeholder={t('yoExtra.interestsPlaceholder')}
                    placeholderTextColor={THEME.colors.text.secondary}
                    onSubmitEditing={onAddInterest}
                    editable={!isSavingProfile}
                    maxLength={50}
                    accessibilityLabel={t('yoExtra.addInterestFieldA11y')}
                    accessibilityHint={t('yoExtra.addInterestFieldHint')}
                  />
                  <TouchableOpacity
                    style={[
                      styles.addButton,
                      (!newInterest.trim() || isSavingProfile) && styles.addButtonDisabled,
                    ]}
                    onPress={onAddInterest}
                    disabled={!newInterest.trim() || isSavingProfile}
                    accessibilityRole="button"
                    accessibilityLabel={t('yoExtra.addInterestA11y')}
                    accessibilityHint={t('yoExtra.addInterestHint')}
                    accessibilityState={{ disabled: !newInterest.trim() || isSavingProfile }}
                  >
                    <Plus size={20} color={THEME.colors.onGradient} />
                  </TouchableOpacity>
                </View>
                {newInterest.length > 40 ? (
                  <Text style={styles.lengthWarning}>
                    {t('yoExtra.charsRemaining', { count: 50 - newInterest.length })}
                  </Text>
                ) : null}
              </View>

              <Text style={styles.formHelpText}>{t('yoExtra.profileDataHelp')}</Text>
            </ScrollView>

            <View style={styles.modalActions}>
              <CalmPrimaryButton
                label={t('common.cancel')}
                onPress={handleClose}
                variant="soft"
                disabled={isSavingProfile}
                style={styles.modalActionBtn}
              />
              <CalmPrimaryButton
                label={t('common.save')}
                onPress={() => void handleSave()}
                loading={isSavingProfile}
                disabled={isSavingProfile}
                style={styles.modalActionBtn}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: THEME.colors.overlay,
    justifyContent: 'flex-end',
  },
  modalKeyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
  },
  modalContent: {
    backgroundColor: THEME.colors.calm.card,
    borderTopLeftRadius: THEME.borderRadius.rounded,
    borderTopRightRadius: THEME.borderRadius.rounded,
    width: '100%',
    maxHeight: Math.min(WINDOW_H * 0.92, 720),
    paddingBottom: THEME.spacing.lg,
  },
  modalScrollView: {},
  modalIntro: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
    marginBottom: THEME.spacing.md,
  },
  modalScrollContent: {
    padding: THEME.spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.lg,
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.lg,
  },
  modalTitle: {
    ...THEME.typography.sectionTitle,
    color: THEME.colors.text.main,
  },
  modalCloseButton: {
    padding: THEME.spacing.xs,
  },
  formSection: {
    marginBottom: THEME.spacing.lg,
  },
  formLabel: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
    marginBottom: THEME.spacing.sm,
  },
  formInput: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    backgroundColor: THEME.colors.calm.card,
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  formHelpInline: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    marginTop: THEME.spacing.xs,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.xs,
    marginBottom: THEME.spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.pill,
    gap: THEME.spacing.xs,
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
  },
  chipText: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
  },
  chipRemove: {
    padding: 2,
  },
  addInputContainer: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
    alignItems: 'center',
  },
  addInput: {
    flex: 1,
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    backgroundColor: THEME.colors.calm.mist,
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.calm.lavenderDeep,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  emptyListText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontStyle: 'italic',
    marginBottom: THEME.spacing.sm,
  },
  lengthWarning: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    marginTop: THEME.spacing.xs,
  },
  formHelpText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    marginTop: THEME.spacing.md,
    fontStyle: 'italic',
  },
  errorContainer: {
    backgroundColor: THEME.colors.semantic.danger + '15',
    borderRadius: THEME.borderRadius.standard,
    padding: THEME.spacing.sm,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.semantic.danger + '40',
  },
  errorText: {
    ...THEME.typography.caption,
    color: THEME.colors.semantic.danger,
  },
  modalActions: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.lg,
    marginTop: THEME.spacing.sm,
  },
  modalActionBtn: {
    flex: 1,
  },
});
