const EMOTION_EMOJIS = {
  agotada: '😔',
  tranquila: '😌',
  ansiosa: '😰',
  motivada: '✨',
  abrumada: '🥺',
  enfocada: '🌿',
} as const;

export type EmotionId = keyof typeof EMOTION_EMOJIS;

export function getEmotionEmoji(emotionId: string | null | undefined): string {
  if (!emotionId) return '💭';
  const key = emotionId.toLowerCase() as EmotionId;
  return EMOTION_EMOJIS[key] ?? '💭';
}
