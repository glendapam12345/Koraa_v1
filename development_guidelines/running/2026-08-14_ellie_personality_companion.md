# Ellie — personalidad oficial (compañera calmada)

**Fecha:** 2026-08-14  
**Estado:** running  
**Código:** [`lib/elliePersonality.ts`](../../lib/elliePersonality.ts)

## Norte

Como el búho de Duolingo, pero **tranquila**: presencia cálida, mensajes cortos, sin presión ni culpa.

## Expresiones (guía)

| Expresión | Emoción | Uso | Arte hoy |
|---|---|---|---|
| Neutral | Calma | Hoy idle | `default` |
| Happy | Alegría suave | Paso hecho / motivada | `happy` |
| Sleepy | Descanso | Energía baja / agotada | `sleepy` |
| Focus | Concentración | Check-in enfocada | `focus` |
| Comforting | Contención | Abrumada | `comforting` |
| Proud | Orgullo suave | Racha | `proud` |
| Cozy | Noche / calma | Tranquila, night | `cozy` |
| Curious | Motivación leve | Captura | `curious` |
| Breathing | Regulación | Ansiosa / respiro | `breathing` |
| Grateful | Cierre | Suficiente hoy | `grateful` |

## API

```ts
resolveElliePresence(moment, { emotionKey, energyLevel, salt })
// → { expression, mood, messageKey }

resolveEllieCompanionCue(emotion, energy) // Hoy post check-in
```

Frases: `ellie.lines.*` (ES/EN).

## Notificaciones (lock screen)

El aviso del teléfono habla como **Koraa** (marca), nunca como Ellie.
Nadie conoce aún a Ellie fuera de la app — a diferencia de Duo.
Ellie puede verse en el retrato; el título y el cuerpo dicen Koraa.

**Un solo hábito:** recordatorio diario a la hora elegida.
No se programan re-check ni captura de tareas salvo opt-in en Ajustes.
Día 0 en Hoy: un paso + cita de mañana (`HoyFirstDayClose`).
Al volver (sin check-in hoy): Koraa recuerda ayer (`lib/returnMemory.ts`) — una frase, sin culpa.

## Ellie nunca

- Juzga, presiona, castiga o usa sarcasmo
- Se mueve brusca o hiperactiva
- Compite con el hero (1 presencia por pantalla)
- Se nombra en notificaciones del sistema
