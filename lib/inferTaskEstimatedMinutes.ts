import type { TaskEffort } from '@/lib/taskPerceivedEffort';
import { clampEstimatedMinutes, effortToDefaultMinutes } from '@/lib/taskPlanningMeta';

/** Duración explícita en el texto: «30 min», «1h», «1 hora 30». */
export function extractExplicitDurationMinutes(text: string): number | null {
  const lower = text.toLowerCase();

  const hourMin = lower.match(
    /(\d+)\s*(?:h|hr|hrs|hora|horas)\s*(?:(?:y|and)\s*)?(\d{1,2})?\s*(?:min(?:uto)?s?)?/i,
  );
  if (hourMin) {
    const hours = Number(hourMin[1]) || 0;
    const mins = hourMin[2] ? Number(hourMin[2]) : 0;
    const total = hours * 60 + mins;
    if (total >= 5) return clampEstimatedMinutes(total);
  }

  const minOnly = lower.match(/(\d{1,3})\s*(?:min(?:uto)?s?|m)\b/i);
  if (minOnly) {
    const value = Number(minOnly[1]);
    if (value >= 5 && value <= 8 * 60) return clampEstimatedMinutes(value);
  }

  return null;
}

/** Koraa infiere minutos según el tipo de paso — sin preguntar. */
export function inferEstimatedMinutesFromText(
  content: string,
  effort?: TaskEffort | null,
): number {
  const explicit = extractExplicitDurationMinutes(content);
  if (explicit != null) return explicit;

  const lower = content.toLowerCase();

  if (/\b(reel|tiktok|shorts|video|grabar|filmar|editar video|montar)\b/.test(lower)) {
    return 90;
  }
  if (/\b(presentaci[oó]n|presentation|deck|pitch|slides|diapositivas)\b/.test(lower)) {
    return 60;
  }
  if (/\b(investigar|research|estrategia|strategy|planificar|roadmap|diseñar|design)\b/.test(lower)) {
    return 75;
  }
  if (
    /\b(llamar|call|telefonear|marcar|email|correo|whatsapp|mensaje|responder|reply)\b/i.test(
      lower,
    ) ||
    /\bmarcarle\b/i.test(lower)
  ) {
    return 20;
  }
  if (/\b(comprar|buy|super|mercado|farmacia|recoger|tramite|trámite|pagar|pay)\b/.test(lower)) {
    return 30;
  }
  if (/\b(leer|read|estudiar|study|curso|capítulo|chapter)\b/.test(lower)) {
    return 45;
  }
  if (/\b(limpiar|clean|ordenar|organizar casa|lavar)\b/.test(lower)) {
    return 40;
  }
  if (/\b(cocinar|cook|meal prep|receta)\b/.test(lower)) {
    return 45;
  }
  if (/\b(ejercicio|workout|gym|yoga|meditar|meditation)\b/.test(lower)) {
    return 30;
  }

  return effortToDefaultMinutes(effort ?? undefined);
}
