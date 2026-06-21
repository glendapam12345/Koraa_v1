/**
 * Detección automática de categoría basada en palabras clave (ES + EN).
 * Las categorías son invisibles para el usuario pero se detectan automáticamente.
 */

export function detectCategory(content: string): string {
  const lowerContent = content.toLowerCase();

  const trabajoKeywords = [
    'trabajo', 'oficina', 'reunión', 'proyecto', 'cliente', 'jefe', 'equipo',
    'deadline', 'presentación', 'reporte', 'email', 'llamada', 'videollamada',
    'tarea del trabajo', 'jornada', 'horario', 'colaborador', 'meeting',
    'entregable', 'código', 'desarrollo', 'diseño', 'marketing', 'ventas',
    'pitch', 'inversor', 'investor', 'fundraising',
    'work', 'office', 'meeting', 'project', 'client', 'boss', 'team',
    'presentation', 'report', 'call', 'zoom', 'deliverable', 'code',
    'development', 'design', 'sales',
  ];

  const saludKeywords = [
    'ejercicio', 'gym', 'gimnasio', 'correr', 'caminar', 'yoga', 'meditación',
    'doctor', 'médico', 'cita médica', 'salud', 'nutrición', 'dieta', 'comida saludable',
    'terapia', 'psicólogo', 'dormir', 'descanso', 'relajación', 'masaje',
    'vitaminas', 'suplementos', 'chequeo', 'análisis', 'examen médico',
    'exercise', 'workout', 'run', 'walk', 'meditation', 'therapy', 'sleep',
    'rest', 'relax', 'health', 'nutrition', 'diet', 'doctor', 'medical',
  ];

  const personalKeywords = [
    'familia', 'amigos', 'cita', 'cumpleaños', 'regalo', 'compras', 'supermercado',
    'casa', 'limpieza', 'organizar', 'hobby', 'pasatiempo', 'libro', 'película',
    'viaje', 'vacaciones', 'finanzas', 'pagar', 'factura', 'banco', 'ahorro',
    'estudio', 'universidad', 'curso', 'aprender', 'leer', 'escribir',
    'family', 'friends', 'birthday', 'gift', 'shopping', 'grocery', 'home',
    'clean', 'hobby', 'book', 'movie', 'travel', 'vacation', 'finance', 'pay',
    'bank', 'study', 'university', 'course', 'learn', 'read', 'write',
  ];

  const trabajoMatches = trabajoKeywords.filter((keyword) => lowerContent.includes(keyword)).length;
  const saludMatches = saludKeywords.filter((keyword) => lowerContent.includes(keyword)).length;
  const personalMatches = personalKeywords.filter((keyword) => lowerContent.includes(keyword)).length;

  const maxMatches = Math.max(trabajoMatches, saludMatches, personalMatches);

  if (maxMatches === 0) {
    return '';
  }

  if (trabajoMatches === maxMatches) {
    return 'trabajo';
  }
  if (saludMatches === maxMatches) {
    return 'salud';
  }
  if (personalMatches === maxMatches) {
    return 'personal';
  }

  return '';
}
