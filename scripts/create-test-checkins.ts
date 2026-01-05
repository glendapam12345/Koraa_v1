/**
 * Script para crear check-ins de prueba
 * Ejecutar desde la app o desde una pantalla de desarrollo
 */

import { supabase } from '@/lib/supabase';

const EMOTIONS = ['Tranquila', 'Enfocada', 'Motivada', 'Ansiosa', 'Agotada', 'Abrumada'];
const TIME_OPTIONS = ['Poco (1-2hrs)', 'Medio (2-4hrs)', 'Bastante (4-6hrs)', 'Todo el día'];
const FOCUS_OPTIONS = ['Muy distraída', 'Algo distraída', 'Normal', 'Enfocada', 'Súper enfocada'];

export async function createTestCheckIns(userId: string, days: number = 14) {
  const today = new Date();
  const checkIns = [];

  // Crear check-ins para los últimos N días
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateString = date.toISOString().split('T')[0];

    // Variar emociones y energía para mostrar diferentes colores
    const emotionIndex = i % EMOTIONS.length;
    const emotion = EMOTIONS[emotionIndex];
    
    // Variar energía (1-5) para mostrar diferentes alturas
    const energyLevel = (i % 5) + 1;
    
    // Valores aleatorios pero consistentes para tiempo y enfoque
    const timeIndex = i % TIME_OPTIONS.length;
    const focusIndex = i % FOCUS_OPTIONS.length;

    checkIns.push({
      user_id: userId,
      date: dateString,
      emotion: emotion,
      energy_level: energyLevel,
      available_time: TIME_OPTIONS[timeIndex],
      focus_level: FOCUS_OPTIONS[focusIndex],
    });
  }

  // Insertar check-ins en la base de datos
  const { data, error } = await supabase
    .from('daily_check_ins')
    .upsert(checkIns, { onConflict: 'user_id,date' });

  if (error) {
    console.error('Error creando check-ins de prueba:', error);
    return { success: false, error };
  }

  console.log(`✅ Creados ${checkIns.length} check-ins de prueba`);
  return { success: true, count: checkIns.length };
}
