# Racha: animación tipo “mascota” (visión futura)

**Estado:** v1 implementada (logo + pulso); expansión opcional (Lottie, milestones).  
**Fecha:** abril 2026

## Implementado (v1)

- Asset: `assets/images/koraa-logo.png` (export del ícono floral Koraa).
- Componente: `components/branding/KoraaBloomLogo.tsx` — entrada tipo “florecer” (spring desde ~0.82→1) y pulso suave en loop si `active` (p. ej. `currentStreak > 0`).
- Uso: pestaña **Yo** (tarjeta de racha) e **Inicio** junto al badge de racha cuando hay días de racha.

**Nota:** El PNG puede optimizarse (tamaño ~800KB+) con compresión o `@expo/image` + WebP si hace falta.

### v2 (implementado)

- Tras guardar check-in en `onboarding/focus.tsx`: `publishCheckInCelebration` (~450 ms después de ir a tabs) con racha y si es hito 7/14/30/60/90.
- `KoraaBloomLogo`: burst + halo azul al evento; suscripción global.
- `StreakAura` en **Yo** detrás del logo (intensidad según racha).
- **Inicio**: refresco de racha/check-in; confetti + toast + haptics si hito.

## Intención de producto (siguientes pasos)

Recompensa visual clara al mantener la racha, con identidad Koraa: **flor / luz / calma**, no presión tipo juego agresivo. Referencia útil: el “personaje” de Duolingo, pero el tono aquí es **bienestar**, no castigo ni ironía.

---

## Recomendaciones de animación (prioridad sugerida)

**1. “Bloom burst” al completar Sentir (recomendada como siguiente paso)**  
Una sola vez al guardar el check-in: el logo escala con spring + **brillo suave** (overlay radial o partículas muy pocas, blanco/azul/rosa muy bajo contraste).  
- *Por qué encaja:* refuerza el ritual del día sin distraer; encaja con el PNG actual.  
- *Stack:* Reanimated + `expo-linear-gradient` animado o capas con opacidad; Lottie solo si diseñas un JSON ligero.

**2. Halo / aurora según nivel de racha**  
En la tarjeta de Yo, un **anillo o degradado muy suave** alrededor del logo que intensidad o color cambia con `getStreakLevel` (más “lleno” a 30+ días).  
- *Por qué encaja:* premia la constancia sin personaje nuevo; muy “Koraa”.  
- *Stack:* Reanimated (scale/opacity del halo) + colores del tema.

**3. Micro-celebración en hitos (7 / 14 / 30 días)**  
Confetti ya existía en el repo (a veces desactivado): **reactivar solo en hitos** + haptic ligero + copy corto (“7 días cuidándote”).  
- *Por qué encaja:* momento memorable sin animación compleja permanente.

**4. Lottie con “pétalos” o luz (opcional, si hay presupuesto de diseño)**  
Un JSON corto (≤200 KB) de pétalos que se abren o polvo de luz. Evitar personajes con cara tipo Duo si el tono de marca es más adulto y sereno.  
- *Cuándo:* si quieres algo más rico que Reanimated puro.

**Qué evitaría por defecto:** dragones, personajes sarcásticos, loops muy rápidos o sonidos agudos; compiten con la calma del producto.

## Alcance técnico (cuando se aborde)

- **Lottie** (`lottie-react-native`) o secuencias con **react-native-reanimated** + assets SVG/PNG.
- Disparadores: milestones (7, 14, 30 días), subida de nivel de racha (`getStreakLevel` en `yo.tsx`), o primera check-in del día.
- Mantener performance en listas y en Expo Go / builds EAS.

## Regla de negocio (no negociable)

La racha sigue midiendo solo **check-ins en Sentir** (`daily_check_ins`). Cualquier mascota debe celebrar eso, no meditación u otras acciones, salvo que el producto cambie explícitamente las reglas.

## Relación con la UI actual

Textos en **Inicio** y **Yo** explican ya la regla. La mascota sería capa de **feedback emocional**, no de sustituir esa claridad.
