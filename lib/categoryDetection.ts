/**
 * Detección automática de categoría basada en palabras clave
 * Las categorías son invisibles para el usuario pero se detectan automáticamente
 */

export function detectCategory(content: string): string {
  const lowerContent = content.toLowerCase();
  
  // Palabras clave para Trabajo
  const trabajoKeywords = [
    'trabajo', 'oficina', 'reunión', 'proyecto', 'cliente', 'jefe', 'equipo',
    'deadline', 'presentación', 'reporte', 'email', 'llamada', 'videollamada',
    'tarea del trabajo', 'jornada', 'horario', 'colaborador', 'meeting',
    'entregable', 'código', 'desarrollo', 'diseño', 'marketing', 'ventas'
  ];
  
  // Palabras clave para Salud
  const saludKeywords = [
    'ejercicio', 'gym', 'gimnasio', 'correr', 'caminar', 'yoga', 'meditación',
    'doctor', 'médico', 'cita médica', 'salud', 'nutrición', 'dieta', 'comida saludable',
    'terapia', 'psicólogo', 'dormir', 'descanso', 'relajación', 'masaje',
    'vitaminas', 'suplementos', 'chequeo', 'análisis', 'examen médico'
  ];
  
  // Palabras clave para Personal
  const personalKeywords = [
    'familia', 'amigos', 'cita', 'cumpleaños', 'regalo', 'compras', 'supermercado',
    'casa', 'limpieza', 'organizar', 'hobby', 'pasatiempo', 'libro', 'película',
    'viaje', 'vacaciones', 'finanzas', 'pagar', 'factura', 'banco', 'ahorro',
    'estudio', 'universidad', 'curso', 'aprender', 'leer', 'escribir'
  ];
  
  // Contar coincidencias
  const trabajoMatches = trabajoKeywords.filter(keyword => lowerContent.includes(keyword)).length;
  const saludMatches = saludKeywords.filter(keyword => lowerContent.includes(keyword)).length;
  const personalMatches = personalKeywords.filter(keyword => lowerContent.includes(keyword)).length;
  
  // Determinar categoría con más coincidencias
  const maxMatches = Math.max(trabajoMatches, saludMatches, personalMatches);
  
  if (maxMatches === 0) {
    return ''; // Sin categoría si no hay coincidencias
  }
  
  if (trabajoMatches === maxMatches) {
    return 'trabajo';
  } else if (saludMatches === maxMatches) {
    return 'salud';
  } else if (personalMatches === maxMatches) {
    return 'personal';
  }
  
  return ''; // Default: sin categoría
}
