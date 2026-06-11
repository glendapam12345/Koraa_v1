import type { EmotionTip } from '@/lib/emotionTips';

export const EMOTION_TIPS_EN: Record<string, EmotionTip[]> = {
  agotada: [
    { id: 'agotada-1', tip: 'Today can be a short day: 1–2 small things are enough', category: 'rest' },
    { id: 'agotada-2', tip: 'Breathe deeply. Your body is asking for a pause', category: 'mindset' },
    { id: 'agotada-3', tip: 'Resting counts too. You do not need to do it all', category: 'mindset' },
    { id: 'agotada-4', tip: 'Small steps count. Start with the easiest one', category: 'productivity' },
  ],
  ansiosa: [
    { id: 'ansiosa-1', tip: 'Take 5 minutes to breathe before you start', category: 'mindset' },
    { id: 'ansiosa-2', tip: 'One thing at a time. You do not need to do everything today', category: 'productivity' },
    { id: 'ansiosa-3', tip: 'Small steps count. Start with the easiest one', category: 'productivity' },
    { id: 'ansiosa-4', tip: 'Break big things into small steps. Breathe between each one', category: 'action' },
  ],
  motivada: [
    { id: 'motivada-1', tip: 'If you feel up to it, channel this energy into one thing that matters', category: 'productivity' },
    { id: 'motivada-2', tip: 'A good moment for something you care about — without rushing', category: 'action' },
    { id: 'motivada-3', tip: 'High energy does not mean doing everything. One step is enough', category: 'mindset' },
    { id: 'motivada-4', tip: 'Keep the pace but do not burn out. Breaks count too', category: 'rest' },
  ],
  tranquila: [
    { id: 'tranquila-1', tip: 'This calm can help with one thing that needs clarity', category: 'productivity' },
    { id: 'tranquila-2', tip: 'A good day for a small decision, without rush', category: 'action' },
    { id: 'tranquila-3', tip: 'Keep this balance. You do not need to speed up', category: 'mindset' },
    { id: 'tranquila-4', tip: 'With calm, one thing done gently can be enough', category: 'productivity' },
  ],
  abrumada: [
    { id: 'abrumada-1', tip: 'Breathe. Break large things into small steps', category: 'mindset' },
    { id: 'abrumada-2', tip: 'Only essentials today. The rest can wait', category: 'productivity' },
    { id: 'abrumada-3', tip: 'Ask for help if you need it. You do not have to do it alone', category: 'mindset' },
    { id: 'abrumada-4', tip: 'Start with the smallest step. One at a time', category: 'action' },
  ],
  enfocada: [
    { id: 'enfocada-1', tip: 'If you feel up to it, you could tackle something a bit deeper', category: 'productivity' },
    { id: 'enfocada-2', tip: 'Protect this moment: fewer interruptions, more calm', category: 'action' },
    { id: 'enfocada-3', tip: 'One calm step beats trying to do everything at once', category: 'productivity' },
    { id: 'enfocada-4', tip: 'Alternate with breaks. Sustainable rhythm wins', category: 'rest' },
  ],
};
