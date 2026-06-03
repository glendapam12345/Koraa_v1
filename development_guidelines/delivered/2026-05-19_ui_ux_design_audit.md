# Auditoría de diseño UI/UX — Koraa

**Fecha:** 2026-05-19  
**Alcance:** App activa en raíz (`app/`, `components/`, `constants/theme.ts`, i18n ES/EN)  
**Método:** Revisión estática de código, patrones de UI, flujos y documentación previa. **No sustituye** pruebas con usuarios ni sesiones en dispositivo físico.  
**Relacionado:** [koraa_ux_flow_audit.md](koraa_ux_flow_audit.md), [2026-05-05_ui_ux_audit_customer_experience.md](2026-05-05_ui_ux_audit_customer_experience.md), [2026-05-05_koraa_voice_and_microcopy_guide.md](2026-05-05_koraa_voice_and_microcopy_guide.md)

---

## Resumen ejecutivo

| Dimensión | Nota (1–5) | Comentario |
|-----------|------------|------------|
| **Sistema visual (THEME)** | 4.5 | Tokens coherentes, gradiente identitario, `meta` para tipografía secundaria |
| **Modelo mental / flujo día** | 4 | Tareas → Sentir → Hoy bien articulado; fricción con orden de tabs |
| **Primera sesión** | 3.5 | Tour + Hoy lite + hints; 6 pestañas y onboarding largo siguen pesando |
| **Pantalla Hoy** | 3.5 | Mucha mejora (componentes `hoy/`, focos, lite); aún densa en vista completa |
| **Tareas / captura** | 4 | Guía de flujo, “Más opciones” colapsado, banner a Sentir |
| **Sentir** | 4 | Recheck rápido, emociones escaneables, CTA a Hoy |
| **Premium / paywall** | 4 | Más ético; modo preview en Expo Go; jerarquía de salidas mejorable |
| **Accesibilidad** | 3.5 | Progreso en auth y componentes clave; gaps en tabs y banners dev |
| **i18n / inclusión** | 3.5 | EN/ES amplio; emociones y ejemplos en femenino fijo |
| **Consistencia global** | 4 | Voz y THEME; pantallas muy largas en código dificultan pulido |

**En una frase:** Koraa tiene identidad clara y un flujo emocional diferenciado; el mayor riesgo UX sigue siendo **carga cognitiva al inicio** (tabs + Hoy completo) y **desalineación tab “Hoy” primero vs flujo “Tareas primero”**.

---

## Fortalezas de diseño (mantener)

1. **Design system centralizado** (`constants/theme.ts`): colores, spacing 8pt, tipografía, sombras, categorías, gradientes de meditación.
2. **Flujo emocional explícito:** `FlowIndicator`, `TasksFlowCard`, tour primera sesión, FAQ en Ayuda desde Hoy/Sentir.
3. **Priorización transparente:** “Por qué está arriba/abajo” en `TaskCard`, barra de focos, `HoyFocusScopeBanner`.
4. **Estados vacíos y errores orientados a acción** (ir a Sentir, reintentar perfil, banner Supabase en dev).
5. **Premium menos invasivo** en Semana (`PremiumLock` con loading dedicado, no flash de contenido bloqueado).
6. **Mitigaciones recientes:** Hoy lite día 1, recheck en Sentir, paywall Expo Go en preview, voz sin botón falso.

---

## Hallazgos por severidad

### P0 — Crítico (confusión o confianza)

#### 1. Orden de pestañas vs flujo enseñado
- **Tabs:** primera pestaña = **Hoy** (`index`), luego Tareas, Sentir…
- **Tour y FlowIndicator:** enseñan **Tareas → Sentir → Hoy**.

**Efecto:** Usuario nuevo abre la app en “Hoy”, ve lista vacía o mensaje de check-in, y solo después descubre que debía ir a Tareas. El tour ayuda, pero quien lo salta repite el patrón.

**Recomendación:** Valorar (a) reordenar tabs con Tareas primero, (b) deep link post-onboarding a Tareas, o (c) empty state en Hoy más dominante: “Empieza en Tareas” con CTA primario.

#### 2. Banner técnico Supabase en tabs (`SupabaseHealthBanner`)
- Visible para dev/QA cuando falla schema o red.

**Efecto en testers:** Parece producto roto; copy técnico (migraciones, columnas).

**Recomendación:** Solo `__DEV__` o flag explícito; en builds TestFlight mensaje usuario (“No pudimos sincronizar”) sin jerga SQL.

---

### P1 — Alto (experiencia y retención)

#### 3. Densidad de **Hoy** en vista completa (~1.3k líneas en `index.tsx`)
- Módulos: hero, racha, focos, filtros, recomendaciones, meditación, día cambió, redistribuir, lite toggle, etc.
- Refactor a `components/hoy/*` ayuda mantenimiento; **percepción en pantalla** sigue siendo muchos bloques.

**Recomendación:** Jerarquía estricta “above the fold”: (1) check-in/hero, (2) 2–5 focos, (3) todo lo demás bajo “Más para hoy” colapsado por defecto (no solo día 1).

#### 4. Seis pestañas sin agrupación
- Hoy, Tareas, Sentir, Semana, Consejos, Yo.

**Efecto:** Exploración lateral alta; Semana/Consejos compiten con el loop diario.

**Recomendación:** Mantener 6 si negocio lo exige; reforzar tour + badge “opcional” en Semana/Consejos; o agrupar “Planificar” (Semana) bajo Hoy como entrada secundaria a futuro.

#### 5. Paywall — múltiples salidas de igual peso visual
- Cerrar (X), explorar gratis, continuar gratis, restaurar, legal.

**Efecto:** Decisión difusa; menor conversión clara.

**Recomendación:** Una salida secundaria dominante (“Seguir gratis”); legal en footer pequeño; restaurar como link terciario.

#### 6. Estrategia Premium fragmentada por tab
- Semana: `PremiumLock` + hint 3 días.
- Consejos: límite + teaser.
- Yo: menú suscripción.
- Onboarding: paywall al final.

**Efecto:** Reglas percibidas como distintas.

**Recomendación:** Matriz única “qué es free vs premium” en Ayuda + mismo patrón visual de teaser (`PremiumTeaserCard`) en Semana y Consejos.

#### 7. Onboarding largo antes del valor
- Intro + emoción + energía + tiempo + foco (+ paywall opcional).

**Efecto:** Fatiga antes de capturar la primera tarea.

**Recomendación:** “Ruta rápida”: check-in mínimo (1 emoción + energía) → tabs; resto en segundo acceso desde Sentir.

---

### P2 — Medio (pulido y consistencia)

#### 8. Inclusión de género en copy emocional
- Emociones “agotada”, ejemplos en femenino; `inclusiveNote` no siempre visible en código actual.

**Recomendación:** Variantes neutras o selector de tono en perfil; revisar [guía de voz](2026-05-05_koraa_voice_and_microcopy_guide.md).

#### 9. Tipografía `fontSize: 10` en `FlowIndicator`
- Por debajo de `THEME.typography.meta` (13px); legibilidad en pantallas pequeñas.

**Recomendación:** Usar `THEME.typography.meta` o `small` mínimo.

#### 10. Tareas (`vaciar.tsx` ~1.5k líneas)
- Muchas secciones: flow card, proyectos, opciones, subtareas, sugerencias, banners.

**Recomendación:** Mismo patrón que Hoy: una columna “captura” y acordeón “Organizar (opcional)”.

#### 11. Ajustes duplicados
- `Yo` → `/settings` + posibles modales históricos.

**Recomendación:** Una sola entrada “Ajustes”; idioma y notificaciones ahí.

#### 12. Tab bar sin `accessibilityLabel` custom por tab
- Solo título i18n; iconos sin hint de “paso del flujo”.

**Recomendación:** Hints VoiceOver: “Paso 1 de 3: Tareas” en tab Tareas cuando no hay check-in.

---

### P3 — Bajo (nice to have)

- Animaciones de celebración (confetti) deshabilitadas en algunos contextos — OK por estabilidad.
- Meditación: versión simple en Expo Go — bien documentado; mensaje en UI si aplica.
- Contraste `text.tertiary` (#999) en textos largos — verificar WCAG AA en `meta` sobre `fill[200]`.

---

## Evaluación por pantalla

| Pantalla | UI | UX | Notas |
|----------|----|----|-------|
| **Auth** | 4 | 4 | a11y en login/signup; errores i18n |
| **Onboarding** | 4 | 3 | Visual fuerte; largo |
| **Tareas** | 4 | 4 | Flujo claro; densidad en opciones |
| **Sentir** | 4.5 | 4.5 | Recheck + CTA Hoy |
| **Hoy** | 4 | 3.5 | Identidad; densidad vista full |
| **Semana** | 4 | 3.5 | Premium discreto; calendario requiere build nativo |
| **Consejos** | 4 | 3.5 | Depende de perfil/intereses |
| **Yo** | 4 | 4 | Menú claro; proyectos desde Yo |
| **Paywall** | 4 | 4 | Preview Expo Go; jerarquía CTAs |
| **Ayuda** | 4.5 | 4.5 | FAQ sólido |

---

## Accesibilidad (muestra)

| Área | Estado |
|------|--------|
| `GradientButton` | `accessibilityRole`, `label` desde title |
| `EmotionCard` | Selección anunciada |
| `FlowIndicator` | Botones por paso, `selected` |
| `TaskCard` | Razones de prioridad con `accessibilityLabel` |
| `PremiumLock` loading | `progressbar` + texto |
| `HoyFocusScopeBanner` | Labels compuestos |
| Tabs inferiores | Mejorable (hints de flujo) |
| `FlowIndicator` caption 10px | Riesgo legibilidad |

---

## Premium y conversión (ética)

**Bien:**
- Paywall onboarding opcional con “Explorar gratis”.
- Expo Go: banner preview, sin CTAs de compra engañosos.
- Semana no bloquea toda la pantalla de golpe.

**Mejorar:**
- Unificar mensaje de valor Premium.
- Reducir competencia entre salidas en paywall.
- Consejos: aviso explícito si faltan intereses en perfil (ya parcialmente).

---

## Coherencia visual

- **Gradiente azul–rosa:** consistente en CTAs, banners, hero.
- **Cards:** `fill[100]`, `rounded`, `shadows.soft` — patrón estable.
- **Iconografía:** Lucide, tamaño ~20–24 en acciones.
- **Riesgo:** Pantallas monolíticas dificultan aplicar cambios de densidad de forma uniforme.

---

## Comparativa con auditorías anteriores (mayo 2026)

| Tema | Antes | Ahora |
|------|-------|-------|
| FlowIndicator vs tabs | Confuso | Mitigado (caption, sin números) |
| Ayuda | Solo Yo | Hoy + Sentir + Yo |
| Priorización manual (estrella) | Confundía | Removida / algoritmo claro |
| Voz falsa | Mic engañoso | Hint dictado teclado |
| Hoy mantenibilidad | Monolito | `components/hoy/` |
| Paywall Expo Go | Parecía roto | Modo preview |
| Premium flicker | Children flash | Loading state |

---

## Recomendaciones priorizadas (roadmap UX)

### Quick wins (1–2 sprints)
1. Reordenar tabs o CTA “Empieza en Tareas” en Hoy vacío.
2. Ocultar `SupabaseHealthBanner` fuera de dev.
3. Paywall: jerarquía única de salida secundaria.
4. `FlowIndicator`: subir tamaño de caption a `meta`.

### Medio plazo
5. Hoy: módulos secundarios colapsados por defecto (todos los días).
6. Matriz Premium única en Ayuda + teasers unificados.
7. Onboarding corto opcional.
8. Hints a11y en tab bar para el flujo de 3 pasos.

### Validación (fuera de código)
9. Test moderado con 5 usuarios: tarea “primer día abrumada, 3 pendientes”.
10. TestFlight build 27: flujo completo + calendario + paywall real.

---

## Checklist de validación en dispositivo

- [ ] Usuario nuevo: ¿entiende Tareas → Sentir → Hoy sin leer FAQ?
- [ ] Hoy lite día 1: ¿menos abrumador que vista completa?
- [ ] Completar foco: ¿feedback (toast/barra) se entiende?
- [ ] Recheck Sentir: ¿Hoy actualiza prioridades visiblemente?
- [ ] Semana free: ¿se entiende límite 3 días?
- [ ] Paywall: ¿“Seguir gratis” es obvio?
- [ ] English: ¿tabs y errores coherentes?
- [ ] VoiceOver en Sentir y TaskCard focos.

---

## Referencias de implementación

- Flujo: `components/FlowIndicator.tsx`, `components/tasks/TasksFlowCard.tsx`
- Hoy: `components/hoy/`, `lib/hoyLiteDay.ts`
- Tema: `constants/theme.ts`
- Voz: `development_guidelines/delivered/2026-05-05_koraa_voice_and_microcopy_guide.md`
- TestFlight: `development_guidelines/delivered/2026-05-19_testflight_build_27_calendar.md`
