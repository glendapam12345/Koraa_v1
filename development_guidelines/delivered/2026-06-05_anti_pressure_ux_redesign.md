# Rediseño UX anti-presión — voz, tabs y flujo de check-in

**Fecha:** 2026-06-05  
**Estado:** Entregado (copy + jerarquía principal)  
**Relacionado:** [koraa_ux_flow_audit.md](./koraa_ux_flow_audit.md), [2026-06-05_flow_audit_buttons_cleanup.md](./2026-06-05_flow_audit_buttons_cleanup.md), [2026-06-04_musa_p0_visual_checkin.md](./2026-06-04_musa_p0_visual_checkin.md)

## Propósito

Koraa es una app de **bienestar con tareas**, no de productividad tradicional. La promesa: ayudar a personas abrumadas a sentirse un poco más livianas, a su ritmo.

Este entregable unifica copy, jerarquía visual y responsabilidades de tabs bajo esa filosofía.

---

## Principios de voz (ES / EN)

### Preferir

| Concepto | ES | EN |
|----------|----|----|
| Sugerencia, no orden | «Koraa sugiere…», «podría importar hoy» | «Koraa suggests…», «what might matter today» |
| Pasos | pasos sugeridos | suggested steps |
| Suficiencia | «suficiente para hoy», «un paso basta» | «enough for today», «one step is enough» |
| Mente | claridad mental, cómo está tu mente | mental clarity, how your mind feels |
| Ritmo | «sin prisa», «a tu ritmo», «el resto puede esperar» | «no rush», «at your pace», «the rest can wait» |

### Evitar

- priorizar / priorities (en UI visible)
- focos / focus tasks
- enfoque como meta de rendimiento
- productividad, optimizar, conquistar el día
- reorganizar el día (presión)
- «debes», «tienes que», «aprovecha este momento»

**Nota:** Los identificadores internos (`is_priority`, `focus_level`, ruta `onboarding/focus`) se mantienen por compatibilidad con BD y código; el copy visible usa el lenguaje de la tabla anterior.

---

## Arquitectura de tabs (4 visibles)

| Tab | Ruta | Rol |
|-----|------|-----|
| **Hoy** | `/(tabs)/index` | «¿Qué hacer en los próximos 5 min?» — hero, 1–2 pasos, apoyo unificado |
| **Calendario** | `/(tabs)/semana` | Vista semanal; sin presión de llenar el mes |
| **Para mí** | `/(tabs)/parami` | Insights, musa, memoria emocional |
| **Tu espacio** | `/(tabs)/yo` | Premium, ajustes, cuenta |

**Ocultas en barra:** `vaciar` (Tareas), `tips` (Consejos). La biblioteca de tips sigue en `app/tips/[category].tsx` (stack); acceso desde Hoy (`HoySupportPanel`) y Para mí.

Configuración: `app/(tabs)/_layout.tsx`.

---

## Flujo de check-in

```
Tareas (vaciar) → Check-in en Hoy (embebido) → Pasos sugeridos en Hoy
```

Rutas alternativas (legacy / deep-link):

- Modal `/sentir` — check-in completo o recheck
- Onboarding `emotion → energy → time → focus` — primer check-in
- `QuickRecheckInModal` — actualizar emoción/energía/tiempo/mente

Post-guardado: siempre aterriza en **Hoy** (`/(tabs)`).

### Cambios clave del flujo

- CTA principal: **«Ver qué importa hoy»** (`sentir.visualCheckIn.seeWhatMatters`)
- QuickRecheck: **«¿Cambió tu día?»** (no «Reorganizar mi día»)
- Emoción `enfocada`: etiqueta **«Con claridad»**, emoji 🌿 (no 🎯)
- Paso 4 onboarding: copy de **mente / claridad mental**, no «enfoque»
- Coach Hoy (`lib/hoyDailyCoach.ts`, `supabase/functions/hoy-coach`): fallbacks sin «focos»

---

## Áreas entregadas por pantalla

### Hoy (IA simplificada — 2026-06-05)

Jerarquía en 4 bloques (`HoyFocusPanel`):

1. **Hero** — estado emocional + copy del coach (`HoyMoodHeroCard`, solo lectura)
2. **Esto podría ser suficiente** — máx. 2 pasos (1 si abrumada); CTA «Actualizar cómo me siento»
3. **Si necesitas apoyo** — `HoySupportPanel`: chips Respirar / Meditar / Pausa + CTA contextual + enlace a tips
4. **Ver el resto de hoy** (colapsado) — pasos extra, aliviar carga, lógica Koraa, calendario

Lógica contextual: `lib/hoyContextualSupport.ts` (patrones de 7 días). Componente `HoyContextualSupport` reemplazado por `HoySupportPanel`.

Copy i18n: `bundle*.ts`, `bundle-ext*.ts`, `es.ts` / `en.ts` (`hoy.*`, `smart.*`)

### Consejos (tab oculta)

- Tab `/(tabs)/tips` con `href: null`; pantalla conservada para deep links legacy
- Biblioteca por categoría: `app/tips/[category].tsx` — 1 tip expandido, resto colapsado
- Revisión completa `tipsCatalog.es/en.ts`

### Para mí / Tu espacio

- Cuenta y ajustes en **Tu espacio** (`yo`); Para mí sin sección cuenta duplicada

### Priorización (copy visible)

- `bundle-ext`: `smart`, `hoyPlanFallback`, `hooks`
- `lib/recommendationStrings.ts` — podcasts/libros sin framing de productividad

### Onboarding, paywall, vaciar, tour

- Copy alineado en `bundle*.ts`, `bundle-ui*.ts`
- **Tour 4 tabs (2026-06-05):** Hoy → Calendario → Para mí → Tu espacio; termina en `/(tabs)` — ver [2026-06-05_flow_audit_buttons_cleanup.md](./2026-06-05_flow_audit_buttons_cleanup.md)
- **Paywall con retorno:** `lib/paywallNavigation.ts` → param `next`

---

## Archivos i18n principales

| Archivo | Contenido |
|---------|-----------|
| `lib/i18n/locales/es.ts`, `en.ts` | Sentir, Hoy, tabs |
| `lib/i18n/locales/features/bundle.es.ts`, `bundle.en.ts` | Hoy, onboarding, semana |
| `lib/i18n/locales/features/bundle-ext.es.ts`, `bundle-ext.en.ts` | Smart, check-in summary, quickRecheck |
| `lib/i18n/locales/features/bundle-ui.*.ts` | A11y onboarding |
| `lib/i18n/locales/tipsCatalog.*.ts` | Catálogo de 28 tips |
| ~~`lib/recommendationStrings.ts`~~ | Eliminado 2026-06-05 (limpieza audit) |

---

## Verificación

```bash
npx expo-doctor   # salud del proyecto
npm run typecheck
npm run lint
npm run dev       # probar Hoy → check-in → pasos sugeridos
```

Última verificación: **typecheck, lint y 71 tests OK** (2026-06-05, incl. audit flujo + limpieza). Detalle: [2026-06-05_flow_audit_buttons_cleanup.md](./2026-06-05_flow_audit_buttons_cleanup.md).

---

## Pendiente / backlog

| # | Item | Notas |
|---|------|-------|
| 1 | ~~`app/checkin-summary.tsx`~~ | ✅ Eliminada 2026-06-05 — flujo va directo a Hoy tras check-in |
| 2 | ~~`HoyContextualSupport`~~ | ✅ Entregado 2026-06-05 — unificado en `HoySupportPanel` + `lib/hoyContextualSupport.ts` |
| 3 | ~~`lib/tipsPersonalization.ts`~~ | ✅ Entregado 2026-06-05 — sin boost productivity por energía; penaliza en estados pesados |
| 4 | Renombrar keys legacy | `viewPriorities`, `generateFocos`, `is_priority` en copy keys |
| 5 | `focus_level` en BD | Valores en español (`Enfocada`, etc.) — considerar i18n en UI |

---

## Cómo extender sin romper el tono

1. Nuevas cadenas → `lib/i18n/locales/` (ES + EN); revisar tabla «Preferir / Evitar» arriba.
2. CTAs en Hoy: un primario suave, secundarios colapsables («Más opciones»).
3. Tras check-in: celebrar suficiencia, no volumen completado.
4. Tests de regresión de copy: buscar `prioriz`, `foco`, `productividad`, `enfoque` en `lib/i18n/` y componentes de usuario.
