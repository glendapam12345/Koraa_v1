import type { EmotionTip } from '@/lib/emotionTips';

export const EMOTION_TIPS_EN: Record<string, EmotionTip[]> = {
  agotada: [
    { id: 'agotada-1', tip: 'Time to rest. Prioritize only 1–2 essential tasks today', category: 'rest' },
    { id: 'agotada-2', tip: 'Breathe deeply. Your body is asking for a pause', category: 'mindset' },
    { id: 'agotada-3', tip: 'Remember: resting is productive too. You do not need to do it all', category: 'mindset' },
    { id: 'agotada-4', tip: 'Small tasks count. Start with the easiest one', category: 'productivity' },
  ],
  ansiosa: [
    { id: 'ansiosa-1', tip: 'Take 5 minutes to breathe before you start', category: 'mindset' },
    { id: 'ansiosa-2', tip: 'Focus on one task at a time. You do not need to do everything today', category: 'productivity' },
    { id: 'ansiosa-3', tip: 'Small tasks count. Start with the easiest one', category: 'productivity' },
    { id: 'ansiosa-4', tip: 'Break big tasks into small steps. Breathe between each step', category: 'action' },
  ],
  motivada: [
    { id: 'motivada-1', tip: 'Use this energy! Prioritize tasks that need creativity', category: 'productivity' },
    { id: 'motivada-2', tip: 'This is a great moment for important projects', category: 'action' },
    { id: 'motivada-3', tip: 'Balance: high energy does not mean doing everything. Focus on what matters', category: 'mindset' },
    { id: 'motivada-4', tip: 'Keep the pace but do not burn out. Take breaks too', category: 'rest' },
  ],
  tranquila: [
    { id: 'tranquila-1', tip: 'Use this calm for tasks that need focus', category: 'productivity' },
    { id: 'tranquila-2', tip: 'A good day for important decisions', category: 'action' },
    { id: 'tranquila-3', tip: 'Keep this balance. You do not need to rush', category: 'mindset' },
    { id: 'tranquila-4', tip: 'This state is perfect for tasks that need mental clarity', category: 'productivity' },
  ],
  abrumada: [
    { id: 'abrumada-1', tip: 'Breathe. Break large tasks into small steps', category: 'mindset' },
    { id: 'abrumada-2', tip: 'Prioritize only the essentials. The rest can wait', category: 'productivity' },
    { id: 'abrumada-3', tip: 'Ask for help if you need it. You do not have to do it alone', category: 'mindset' },
    { id: 'abrumada-4', tip: 'Start with the smallest task. One step at a time', category: 'action' },
  ],
  enfocada: [
    { id: 'enfocada-1', tip: 'Use this moment for complex tasks', category: 'productivity' },
    { id: 'enfocada-2', tip: 'Stay focused. Avoid distractions', category: 'action' },
    { id: 'enfocada-3', tip: 'This is your peak performance window. Use it well', category: 'productivity' },
    { id: 'enfocada-4', tip: 'Balance work with breaks. Sustainable focus wins', category: 'rest' },
  ],
};
