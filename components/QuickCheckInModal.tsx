import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';
import { THEME } from '@/constants/theme';
import { EmotionCard } from './EmotionCard';
import { GradientButton } from './GradientButton';
import { X } from 'lucide-react-native';
import { router } from 'expo-router';

const EMOTIONS = [
  { id: 'agotada', emoji: '😔', label: 'Agotada' },
  { id: 'tranquila', emoji: '😌', label: 'Tranquila' },
  { id: 'ansiosa', emoji: '😰', label: 'Ansiosa' },
  { id: 'motivada', emoji: '✨', label: 'Motivada' },
  { id: 'abrumada', emoji: '🥺', label: 'Abrumada' },
  { id: 'enfocada', emoji: '🎯', label: 'Enfocada' },
];

interface QuickCheckInModalProps {
  visible: boolean;
  onClose: () => void;
}

export function QuickCheckInModal({ visible, onClose }: QuickCheckInModalProps) {
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
              <Text style={styles.title}>¿Cómo te</Text>
              <Text style={styles.titleAccent}>sientes</Text>
              <Text style={styles.title}>hoy?</Text>
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
            <Text style={styles.description}>
              Selecciona cómo te sientes y continúa con tu check-in completo
            </Text>

            <View style={styles.emotionsGrid}>
              {EMOTIONS.map((emotion) => (
                <View key={emotion.id} style={styles.emotionWrapper}>
                  <EmotionCard
                    emoji={emotion.emoji}
                    label={emotion.label}
                    selected={selectedEmotion === emotion.id}
                    onPress={() => setSelectedEmotion(emotion.id)}
                  />
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <GradientButton
              title="Continuar →"
              onPress={handleContinue}
              disabled={!selectedEmotion}
            />
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
