# Auditoría extensa UI/UX - Experiencia cliente (Koraa)

**Fecha:** 2026-05-05  
**Estado:** Entregado (auditoría estratégica + plan de mejora)  
**Alcance:** App principal (`app/`, `components/`, `constants/theme.ts`)  
**Objetivo:** Mejorar claridad, confianza, retención y conversión sin perder el tono humano de Koraa.

---

## 1) Principios de diseño que debe seguir Koraa

Estos principios reflejan el estilo que se busca para una app con buen UI/UX centrado en cliente:

1. **Utilidad primero**
 - Cada pantalla debe ayudar a completar una acción real del día.
 - Upsell/premium nunca debe bloquear la tarea principal.

2. **Calma cognitiva**
 - Menos ruido visual al inicio de cada flujo.
 - Jerarquía clara: una acción principal, una secundaria.

3. **Empatía operativa**
 - Copy amable y humano, pero concreto.
 - Explicar "qué gano" y "qué sigue" con frases cortas.

4. **Consistencia de interacción**
 - Mismo patrón de botones, estados vacíos, cierre de modales y navegación.
 - El usuario no debería reaprender controles entre tabs.

5. **Accesibilidad real**
 - Etiquetas y estados para lector de pantalla.
 - Touch targets cómodos y buen contraste en texto pequeño.

6. **Conversión ética**
 - Premium contextual, opcional y transparente.
 - Evitar presión agresiva o mensajes ambiguos.

---

## 2) Diagnóstico ejecutivo (resumen)

### Fortalezas actuales

- **Sistema visual sólido** con tokens en `constants/theme.ts`.
- **Identidad clara** (gradientes, tono emocional, lenguaje cercano).
- **Flujo principal bien definido**: Tareas -> Sentir -> Hoy.
- **Estados vacíos trabajados** con orientación accionable.
- **Mejora reciente positiva**: premium en `Semana` más discreto y no invasivo.

### Riesgos principales detectados

- **Accesibilidad inconsistente** en componentes base y auth/onboarding.
- **Sobrecarga visual** en `Hoy` por densidad de bloques y microacciones.
- **Estrategia premium fragmentada** según tab (Semana, Tips, Yo, Onboarding).
- **Inconsistencias de copy/jerarquía** en algunos CTAs y estados de salida.
- **Duplicidad de ajustes** (`settings` separado + modal en `Yo`) que puede confundir.

---

## 3) Hallazgos detallados por severidad

## P0 - Crítico (impacta experiencia base y confianza)

### A. Accesibilidad en componentes base (transversal)
- `components/GradientButton.tsx`: faltan metadatos de accesibilidad consistentes (`role`, `label`, `state`).
- `components/EmotionCard.tsx`: no comunica claramente estado seleccionado a lector de pantalla.

**Impacto cliente:** usuarios con VoiceOver/TalkBack pierden contexto justo en acciones clave.

### B. Premium loading con posible "flicker"
- `components/PremiumLock.tsx` renderiza children durante `isLoading`.

**Impacto cliente:** percepción de "me mostraron algo y luego me lo quitaron".

---

## P1 - Alto (mejora fuerte de UX + conversión)

### A. Paywall con múltiples salidas simultáneas
- `components/PaywallScreen.tsx`: `X`, "Ahora no", "Continuar gratis", "Restaurar", etc. compiten en la misma jerarquía.

**Impacto cliente:** experiencia menos enfocada y menor claridad de decisión.

### B. Estrategia premium inconsistente por contexto
- `app/(tabs)/semana.tsx`: hint suave al final (bueno).
- `app/(tabs)/tips.tsx`: limitación más silenciosa.
- `app/(tabs)/yo.tsx`: entrada por menú.
- `app/onboarding/focus.tsx`: gate al finalizar onboarding.

**Impacto cliente:** reglas de premium percibidas como cambiantes.

### C. Pantalla `Hoy` con carga cognitiva alta
- `app/(tabs)/index.tsx` concentra múltiples módulos con alto peso informativo.

**Impacto cliente:** fatiga, menor escaneabilidad, riesgo de abandono temprano.

---

## P2 - Medio (consistencia y pulido de calidad)

### A. Microcopy de CTA en algunos puntos
- Ejemplos: "Soltar", "Ver más", "Detalles", "Ahora no" sin suficiente contexto situacional.

### B. Legibilidad en texto pequeño
- Repetición de tamaños 11/12 px en metadata y hints en varias pantallas.

### C. Duplicación conceptual de ajustes
- `app/settings.tsx` y modal de ajustes dentro de `app/(tabs)/yo.tsx`.

---

## 4) Evaluación por pantalla (impacto cliente)

- **Hoy (`app/(tabs)/index.tsx`)**  
  Valor alto, pero requiere simplificación progresiva (bloques plegables/prioridad visual por contexto diario).

- **Tareas (`app/(tabs)/vaciar.tsx`)**  
  Muy útil; conviene reforzar claridad verbal de algunas acciones para usuarios nuevos.

- **Sentir (`app/(tabs)/sentir.tsx`)**  
  Buen núcleo emocional; prioridad: accesibilidad de selección y feedback de estado.

- **Semana (`app/(tabs)/semana.tsx`)**  
  Mejora UI reciente correcta (premium discreto al final). Mantener este patrón "utility-first".

- **Consejos (`app/(tabs)/tips.tsx`)**  
  Lock premium requiere más claridad sobre "qué ves gratis vs qué desbloqueas".

- **Yo (`app/(tabs)/yo.tsx`)**  
  Completo pero denso; conviene jerarquizar ajustes y premium para reducir fricción.

- **Paywall (`components/PaywallScreen.tsx`)**  
  Visualmente bueno; falta simplificar árbol de decisión y reforzar copy de beneficio tangible.

- **Auth + Onboarding (`app/auth/*`, `app/onboarding/*`)**  
  Flujo correcto; principal deuda: accesibilidad semántica consistente.

---

## 5) Plan de acción recomendado (enfocado a cliente)

## Fase 1 - Quick wins (1-3 días)

1. **Accesibilidad base**
 - Estandarizar `accessibilityRole`, `accessibilityLabel`, `accessibilityHint`, `accessibilityState` en:
   - `components/GradientButton.tsx`
   - `components/EmotionCard.tsx`
   - CTAs críticos de auth/paywall.

2. **Paywall más claro**
 - Dejar una salida secundaria principal por estado.
 - Unificar copy corto y concreto orientado a beneficio.

3. **Microcopy crítico**
 - Revisar CTAs ambiguos en Tareas/Paywall/Tips.
 - Mantener tono humano pero más explícito.

## Fase 2 - Optimización estructural (1 semana)

1. **Sistema premium consistente**
 - Definir patrón único: teaser contextual + límite transparente + CTA suave.
 - Reaplicar en `Semana`, `Tips`, `Yo`, onboarding post-check-in.

2. **Reducción de carga en `Hoy`**
 - Priorizar módulos "esenciales del día" arriba.
 - Mover contenido secundario a secciones colapsables.

3. **Unificación de Ajustes**
 - Elegir una sola entrada dominante (pantalla o modal), no ambas en paralelo.

## Fase 3 - Excelencia UX (2-3 semanas)

1. **Guía de voz y tono (microcopy system)**
 - Diccionario de verbos, mensajes de error, CTA y estados vacíos.

2. **Auditoría de contraste tipográfico**
 - Ajustar tamaños/colores de textos secundarios para legibilidad sostenida.

3. **Experimentación ligera**
 - A/B de paywall copy y orden de beneficios.
 - Medir impacto real con eventos.

---

## 6) KPIs de experiencia cliente (para validar mejoras)

**Adopción flujo principal**
- % usuarios que completan Tareas -> Sentir -> Hoy en primeras 48h.

**Fricción de interfaz**
- Tiempo a primera acción útil por pantalla (Tareas, Sentir, Hoy).
- Tasa de abandono en onboarding y en paywall.

**Percepción de claridad**
- CTR en CTAs principales vs secundarios.
- Uso de ayuda (`/help`) después de cambios de copy.

**Conversión ética premium**
- Open paywall -> intent purchase -> purchase.
- Retención de usuarios free (no sacrificar experiencia base).

---

## 7) Decisiones de diseño recomendadas (sí/no)

- **Sí**: premium contextual, discreto, basado en valor.  
- **Sí**: priorizar accesibilidad desde componentes base.  
- **Sí**: simplificar jerarquía visual en `Hoy` y `Yo`.  
- **No**: banners premium protagónicos al entrar en pantallas de trabajo.  
- **No**: CTAs ambiguos sin contexto en momentos críticos.  

---

## 8) Conclusión

Koraa ya tiene una base visual y emocional muy buena. El salto a una experiencia "excelente" no depende de rehacer el diseño completo, sino de **consistencia operativa**: accesibilidad, jerarquía de información, premium coherente y microcopy más claro.

Con el plan por fases anterior, la app mejora percepción de calidad, reduce fricción del usuario nuevo y aumenta confianza del usuario activo sin perder la identidad de marca.
