import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';
import { THEME } from '@/constants/theme';
import { EmotionCard } from './EmotionCard';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { X } from 'lucide-react-native';
import { router } from 'expo-router';
import { useI18n } from '@/contexts/I18nContext';

const EMOTION_IDS = ['agotada', 'tranquila', 'ansiosa', 'motivada', 'abrumada', 'enfocada'] as const;
const EMOTION_EMOJIS: Record<(typeof EMOTION_IDS)[number], string> = {
  agotada: '😔',
  tranquila: '😌',
  ansiosa: '😰',
  motivada: '✨',
  abrumada: '🥺',
  enfocada: '🌿',
};

interface QuickCheckInModalProps {
  visible: boolean;
  onClose: () => void;
}

export function QuickCheckInModal({ visible, onClose }: QuickCheckInModalProps) {
  const { t } = useI18n();
  const [selectedEmotion, setSelectedEmotion] = useState<string>('');

  const handleContinue = () => {
    if (!selectedEmotion) return;
    onClose();
    router.push({
      pathname: '/onboarding/emotion',
      params: { emotion: selectedEmotion, from: 'quick' },
    });
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.title}>{t('quickCheckIn.title')}</Text>
              <Text style={styles.titleAccent}>{t('quickCheckIn.titleAccent')}</Text>
              <Text style={styles.title}>{t('quickCheckIn.titleEnd')}</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={24} color={THEME.colors.text.main} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.description}>{t('quickCheckIn.body')}</Text>

            <View style={styles.emotionsGrid}>
              {EMOTION_IDS.map((id) => (
                <View key={id} style={styles.emotionWrapper}>
                  <EmotionCard
                    emoji={EMOTION_EMOJIS[id]}
                    label={t(`sentir.emotions.${id}`)}
                    selected={selectedEmotion === id}
                    onPress={() => setSelectedEmotion(id)}
                  />
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <CalmPrimaryButton label={t('quickCheckIn.continue')} onPress={handleContinue} disabled={!selectedEmotion} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: THEME.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.lg,
  },
  modalContent: {
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    ...THEME.shadows.soft,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: THEME.spacing.lg,
    paddingBottom: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.stroke[100],
  },
  headerContent: {
    flex: 1,
  },
  title: {
    ...THEME.typography.h1,
    color: THEME.colors.text.main,
  },
  titleAccent: {
    ...THEME.typography.h1,
    fontFamily: THEME.fonts.accent.italic,
    color: THEME.colors.text.main,
  },
  closeButton: {
    padding: THEME.spacing.xs,
    marginLeft: THEME.spacing.md,
  },
  content: {
    padding: THEME.spacing.lg,
  },
  description: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 24,
    marginBottom: THEME.spacing.md,
  },
  emotionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  emotionWrapper: {
    width: '50%',
    paddingBottom: THEME.spacing.xs,
  },
  footer: {
    padding: THEME.spacing.lg,
    paddingTop: THEME.spacing.md,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.stroke[100],
  },
});
