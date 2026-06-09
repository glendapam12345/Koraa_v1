# Auditoría de flujo, botones y limpieza de código — Junio 2026

**Fecha:** 2026-06-05  
**Estado:** Entregado (implementación + verificación automatizada)  
**Relacionado:**
- [2026-06-05_anti_pressure_ux_redesign.md](./2026-06-05_anti_pressure_ux_redesign.md) — filosofía anti-presión e IA de tabs
- [koraa_ux_flow_audit.md](./koraa_ux_flow_audit.md) — auditoría UX histórica (2026-05)
- [onboarding_gate_and_tabs_auth.md](./onboarding_gate_and_tabs_auth.md) — gates de auth/onboarding

---

## Resumen ejecutivo

Auditoría completa de navegación, auth, onboarding, las **4 tabs visibles**, rutas ocultas y pantallas stack. Se implementaron fixes en tres oleadas (alta → media → baja) y una **limpieza profunda** de código muerto e i18n.

**Resultado:** el flujo diario canónico queda estable:

```text
Tareas (vaciar, tab oculta) → Check-in en Hoy → Pasos sugeridos → Apoyo opcional
```

**Verificación automatizada (2026-06-05):** `typecheck` OK · `lint` OK (warnings preexistentes) · **71 tests** OK.

---

## Arquitectura actual (4 tabs visibles)

| Tab | Ruta | Rol |
|-----|------|-----|
| **Hoy** | `/(tabs)/index` | Check-in embebido, 1–2 pasos sugeridos, apoyo unificado |
| **Calendario** | `/(tabs)/semana` | Vista semanal/mensual sin presión de llenar el mes |
| **Para mí** | `/(tabs)/parami` | Patrones de ánimo/energía (7–30 días) |
| **Tu espacio** | `/(tabs)/yo` | Perfil, proyectos, Premium, ajustes |

**Ocultas en barra** (`href: null` en `app/(tabs)/_layout.tsx`):

| Tab | Ruta | Rol |
|-----|------|-----|
| Tareas | `/(tabs)/vaciar` | Captura brain-dump; acceso desde Hoy, Calendario, tour |
| Consejos | `/(tabs)/tips` | **Redirect shim** → Hoy (Expo Router requiere el archivo) |

**Stack / modales:**

| Ruta | Rol |
|------|-----|
| `/sentir` | Fallback recheck cuando no hay check-in hoy |
| `/tips/[category]` | Biblioteca de tips; entrada desde `HoySupportPanel` y Para mí |
| `/paywall` | Premium; vuelve al origen vía param `next` |
| `/focus-session` | Pomodoro 25 min |

Configuración de tabs: `app/(tabs)/_layout.tsx`.

---

## Mapa de flujo (post-fixes)

```mermaid
flowchart TD
  Start([App launch]) --> Auth{¿Sesión?}
  Auth -->|No| Login[/auth/login]
  Auth -->|Sí| Gate{¿Onboarding?}
  Login -->|ya hay sesión| Root[/]
  Gate -->|No| Welcome[/onboarding/welcome]
  Gate -->|Sí| Tabs[/(tabs) Hoy]

  Welcome -->|Skip / Intro| Tabs
  Welcome -->|Quick start| Focus[/onboarding/focus]
  Focus --> Paywall[/paywall?next=...]
  Paywall --> Tabs

  Tabs --> Tour{¿Primera sesión?}
  Tour -->|Sí| TourModal[FirstSessionTourModal 4 pasos]
  TourModal --> Tabs
  Tour -->|No| Hoy

  Hoy -->|sin check-in| Inicio[HoyInicioView embebido]
  Inicio -->|captura| Vaciar[/(tabs)/vaciar]
  Inicio -->|check-in| Steps[Pasos sugeridos]
  Steps --> Support[HoySupportPanel]
  Support --> TipsCat[/tips/category]
  Support --> FocusS[/focus-session]
  Steps --> Cal[Calendario]
  Steps --> PM[Para mí]
  Yo[Tu espacio] --> Settings[/settings]
  Yo --> Paywall2[/paywall?next=/settings]
```

**Check-in:** `CHECK_IN_ROUTE = '/(tabs)'` (Hoy embebido).  
**Recheck:** modal global vía `openRecheckCheckIn()` (`RecheckCheckInProvider`); fallback `/sentir` si no hay check-in hoy.

---

## Hallazgos originales (matriz de severidad)

### 🔴 Prioridad alta — resueltos

| # | Problema | Solución |
|---|----------|----------|
| 1 | Loop onboarding si check-in en Hoy sin `onboarding_completed` | `markOnboardingCompleted()` en `saveDailyCheckInAndPrioritize` (`lib/checkInService.ts`) |
| 2 | Tab Consejos huérfana (700+ líneas sin acceso) | `app/(tabs)/tips.tsx` → `<Redirect href="/(tabs)" />` |
| 3 | Paywall siempre devolvía a Hoy | `lib/paywallNavigation.ts` → `openPaywall(router, next)` |
| 4 | Tour y primera sesión aterrizaban en vaciar (tab oculta) | Tour termina en `/(tabs)`; eliminado auto-redirect a vaciar en `_layout.tsx` |

### 🟡 Prioridad media — resueltos

| # | Problema | Solución |
|---|----------|----------|
| 5 | Dos toggles «resto del día» en Hoy | Unificado en `HoyFocusPanel` (`restExpanded` / `onRestExpandedChange`) |
| 6 | Toast en Calendario sin UI | `<Toast>` renderizado en `app/(tabs)/semana.tsx` |
| 7 | Para mí sin enlace a tips | Sección suave → `/tips/rest` (`parami.linkTips`) |
| 8 | Componentes muertos acumulados | Eliminados (ver inventario abajo) |
| 9 | Enlace a captura en resto del día | `hoy.captureTasksLink` → `/(tabs)/vaciar` |

### 🟢 Prioridad baja — resueltos

| # | Problema | Solución |
|---|----------|----------|
| 10 | Tour copy desalineado (mencionaba Tareas como tab) | 4 pasos alineados a tabs visibles (`FirstSessionTourModal`) |
| 11 | Auth screens accesibles con sesión activa | Guard en `app/auth/_layout.tsx` → `router.replace('/')` |
| 12 | `getPostAuthRoute` sin uso | Eliminado de `lib/onboardingGate.ts` |
| 13 | `from=sentir` / `from=quick` en onboarding | Eliminados; flujo único check-in → paywall → Hoy |
| 14 | `QuickCheckInModal` huérfano | Eliminado |
| 15 | Claves i18n muertas | Poda ES+EN (ver sección i18n) |

---

## Implementación por área

### Onboarding y auth

- **Post-login:** `app/index.tsx` y `app/(tabs)/_layout.tsx` → `resolvePostAuthGate()`.
- **Onboarding completo:** cualquier check-in guardado marca `onboarding_completed = true`.
- **Auth guard:** `app/auth/_layout.tsx` redirige usuarios autenticados a `/` antes de mostrar login/signup/forgot-password.
- **Paywall:** `openPaywall(router, '/settings')` etc. — actualizado en Yo, Settings, Para mí, Calendario, tips por categoría.

### Tour de primera sesión

`components/onboarding/FirstSessionTourModal.tsx`:

| Paso | Tab | Icono |
|------|-----|-------|
| 1 | Hoy | Home |
| 2 | Calendario | Calendar |
| 3 | Para mí | Sparkles |
| 4 | Tu espacio | User |

Copy i18n: `tour.step1Title` … `tour.step4Body` en `bundle.es.ts` / `bundle.en.ts`.  
Al terminar u omitir: `router.replace('/(tabs)')`.

### Hoy (`HoyFocusPanel`)

Jerarquía en 4 bloques:

1. Hero emocional (`HoyMoodHeroCard`)
2. 1–2 pasos sugeridos + recheck
3. Apoyo unificado (`HoySupportPanel`)
4. «Ver el resto de hoy» colapsado (toggle único)

### Calendario

- Toast operativo para exportación y mensajes locales.
- Teaser Premium con `openPaywall(router, '/(tabs)/semana')`.

### Para mí

- Gráficas + historial + Premium al final.
- Enlace suave a biblioteca de tips (`/tips/rest`).

---

## Limpieza profunda de código

### Tipos extraídos (componentes → lib)

| Archivo nuevo | Origen |
|---------------|--------|
| `lib/checkInDayData.ts` | `DayData` (antes en `ProgressChart.tsx`) |
| `lib/focusProgressStats.ts` | `FocusProgressStats` (antes en `FocusProgressBar.tsx`) |

Eliminados: `ProgressChart.tsx`, `FocusProgressBar.tsx`.

### Componentes huérfanos eliminados (~20)

Incluye: `PersonalizedBanner`, `SuccessModal`, `ValueCard`, `FlowGuideCard`, `ProjectManager`, `MoodCard`, `MeditationCircle`, `MeditationErrorBoundary`, `PremiumLock`, `ProgressBar`, `SectionHeader`, `StepBadge`, `FocusSessionCard`, cadena tips huérfana (`TipsActionHero`, `TipsMoodHeader`, `TipsCategoryGrid`, …), y los de prioridad media (`HoyFocusScopeBanner`, `QuickCheckInModal`, `TipsWeekChart`, `YoPatternCard`, `RecommendationsSection`, `ParaMiInsights`, `ParaMiAccountSection`).

### Lib / hooks / tests eliminados

| Archivo | Motivo |
|---------|--------|
| `lib/personalizedRecommendations.ts` | Solo usado por `RecommendationsSection` |
| `lib/recommendationStrings.ts` | Cadena huérfana |
| `lib/hoyEmotionalClosure.ts` + test | Solo tests |
| `lib/hoyEmotionalMemory.ts` + test | Solo tests |
| `lib/deviceCalendar.ts` + test | Reemplazado por Google Calendar |
| `lib/streakLevel.ts` | Solo tests |
| `lib/streakDailyMessages.ts` | Sin imports |
| `lib/paramiActionSummary.ts` | Sin imports |
| `lib/emotionTips.ts` + `.en.ts` | Sin imports |
| `hooks/useTipsScreenData.ts` | Resto del tab Consejos |
| `RECHECK_IN_ROUTE` | Eliminado; recheck vía `openRecheckCheckIn()` |

### Poda i18n (ES + EN)

| Área | Qué se eliminó |
|------|----------------|
| Onboarding | `fromSentirSave`, `seeFocusInHoy` |
| Yo | `streakLevel*` (6 claves), `chartInTips*` |
| Para mí | ~50 claves huérfanas (insights, balance, hábitos, cuenta) |
| Tips (tab) | Pantalla completa, gráfica semanal, meditación embebida, mood pills — se mantienen categorías, acciones y `actionHero*` |
| deviceCalendar | Todo excepto `draftDateHint` |
| bundle-ui | `moodCard`, `flowGuide`, `recommendationsExtra`, `projectManager`, `progressUi`, `successModal`, teasers muertos |

---

## Intencionalmente no eliminado

| Item | Motivo |
|------|--------|
| `app/(tabs)/tips.tsx` | Redirect shim requerido por Expo Router para tab oculta |
| `app/sentir.tsx` | Fallback recheck sin check-in hoy |
| `QuickOnboardingModal` | Usado desde `HoyScreenOverlays` |
| `/(tabs)/vaciar` | Paso 1 del flujo diario; acceso desde Hoy/Calendario |

---

## Backlog restante (fuera de este entregable)

| Prioridad | Item | Notas |
|-----------|------|-------|
| UX baja | `HoyLiteBanner` arriba del contenido principal | Orden visual, no funcional |
| Naming | `components/yo/*` usados en Para mí | Renombrar a `components/parami/` o similar |
| Refactor | `semana.tsx`, `settings.tsx` grandes | ~1000+ líneas; extraer subcomponentes |
| Producto | Sustituir «racha» por «días que volviste» | Filosofía anti-presión — ver audit producto |
| QA | Validación manual Expo Go / TestFlight | Checklist abajo |
| Usuarios | Test con 5 personas (primer día estresado) | Fuera de código |

---

## Verificación

```bash
npx expo-doctor
npm run typecheck
npm run lint
npm test
npm run dev   # Expo Go: probar flujos manuales
```

---

## Checklist QA manual

### Auth y onboarding
- [ ] Login con sesión ya activa → redirige a app (no muestra formulario)
- [ ] Check-in en Hoy sin onboarding previo → no vuelve a welcome
- [ ] Paywall desde Ajustes → cerrar → vuelve a Ajustes

### Primera sesión
- [ ] Tour muestra 4 pasos (Hoy, Calendario, Para mí, Tu espacio)
- [ ] Al terminar u omitir tour → aterriza en Hoy

### Flujo diario
- [ ] Hoy sin check-in → formulario embebido funciona
- [ ] Toggle «Ver el resto de hoy» único y colapsable
- [ ] Enlace «Anotar algo en Tareas» → vaciar
- [ ] Chips apoyo → tips / meditación / focus-session
- [ ] Recheck modal cuando ya hay check-in

### Calendario y Para mí
- [ ] Export CSV vacío → toast visible
- [ ] Para mí → enlace «Biblioteca de ideas» → `/tips/rest`

### Deep links legacy
- [ ] `/(tabs)/tips` → redirect a Hoy

---

## Referencias en código

| Área | Archivos |
|------|----------|
| Tabs + tour | `app/(tabs)/_layout.tsx`, `components/onboarding/FirstSessionTourModal.tsx` |
| Auth guard | `app/auth/_layout.tsx` |
| Onboarding gate | `lib/onboardingGate.ts`, `lib/checkInService.ts` |
| Paywall return | `lib/paywallNavigation.ts` |
| Check-in routes | `lib/checkInNavigation.ts`, `lib/recheckCheckInBridge.ts` |
| Recheck modal | `contexts/RecheckCheckInContext.tsx` |
| Hoy IA | `components/hoy/HoyFocusPanel.tsx`, `HoySupportPanel.tsx` |
| Tips redirect | `app/(tabs)/tips.tsx` |

---

## Lecciones aprendidas

1. **Tabs ocultas en Expo Router** siguen necesitando archivo de ruta; un redirect es más seguro que borrar la ruta.
2. **Dos fuentes de verdad para onboarding** (`onboarding_completed` vs check-in real) generaban loops; unificar en el guardado del check-in fue el fix mínimo correcto.
3. **Código muerto acumulado** tras refactors de IA (6→4 tabs) — podar componentes **y** i18n en la misma pasada evita claves fantasma.
4. **Paywall sin `next`** rompe confianza en Premium desde Ajustes; el param de retorno es obligatorio en apps con muchos puntos de entrada.
