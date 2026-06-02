# Auditoría de flujo UX — Koraa (claridad y facilidad de uso)

**Fecha:** 2026-05-02  
**Última actualización:** 2026-05-19  
**Estado:** Done (implementación UX en código; validación en dispositivo pendiente del equipo)  
**Prioridad:** Alta (impacto en primera experiencia y retención)  
**Relacionado con:** Navegación por pestañas, `FlowIndicator`, pantallas `vaciar`, `sentir`, `(tabs)/index` (Hoy), `help.tsx`, onboarding.

---

## Resumen ejecutivo

Auditoría basada en revisión del código y copys (rutas, tabs, mensajes). No sustituye pruebas con usuarios reales.

### Fortalezas

- Onboarding comunica bien el diferencial (“organiza sintiendo…” + ejemplos energía baja/alta).
- FAQ en **Ayuda** (`app/help.tsx`) explica Sentir, Tareas, Hoy y datos de forma directa.
- **FlowIndicator** en Tareas/Sentir refuerza el orden sugerido del día (etiquetas Tareas → Sentir → Hoy, sin números que choquen con la barra de pestañas).
- Copy en Hoy que aclara la racha (check-in en Sentir, no meditación) reduce frustración por expectativas equivocadas.

### Riesgos / carga cognitiva (actualizado tras implementación)

- **Seis pestañas** sigue siendo denso para usuarios nuevos; mitigado en parte con **tour de primera sesión**, **Hoy lite** el primer día calendario en Hoy, y **hint opcional** en Tareas.
- ~~Desajuste número de pasos vs pestañas~~ → **Mitigado:** leyenda «Orden sugerido para tu día» y sin dígitos 1–3 en `FlowIndicator`.
- ~~Ayuda solo desde Yo~~ → **Mitigado:** icono Ayuda en cabeceras de **Hoy** y **Sentir** (además de **Yo**).
- Flujo de **Tareas** sigue siendo rico en opciones; mitigado con tarjeta «Todo lo demás es opcional» + **captura rápida** (foco del día + «Más opciones» colapsado por defecto).

### Mejoras 2026-05-19 (auditoría de seguimiento)

| Área | Cambio |
|------|--------|
| **Hoy** | Progreso de focos, toasts al completar, `FlowIndicator`, tarjeta «¿Cambió tu día?» dismissible 1×/día, hero sin píldora duplicada; UI en `components/hoy/` (`HoyTasksSection`, `HoyScreenOverlays`, …) — ver [TestFlight build 26](2026-05-19_testflight_build_26.md) |
| **Sentir** | Si ya hay check-in: tarjeta **Reorganizar rápido** (`QuickRecheckInModal`) + check-in completo abajo |
| **Semana** | Barra de focos del día + copy free «ves 3 días» en teaser Premium |
| **Boot** | `AppLoadingGate` + reintento si falla lectura de perfil (`resolvePostAuthGate`) |
| **Tareas** | Captura rápida: escribir → foco opcional → guardar; proyecto/fecha bajo «Más opciones» |
| **Tests** | `__tests__/lib/` para `priorityProgress`, `hoyDayFlowDismiss`, `onboardingGate` |

---

## Modelo mental que el usuario debe internalizar

| Pieza | Dónde | Para qué |
|--------|--------|-----------|
| Volcar pendientes | Pestaña **Tareas** | Que el sistema sepa qué hay que hacer |
| **Sentir** (check-in) | **Sentir** | Priorización alineada al estado del día |
| Ver prioridades | **Hoy** | Resultado de la lógica |

Sin Sentir, Hoy puede mostrar mensajes que guían al check-in; sin capturar en Tareas, el valor de priorización no tiene sobre qué aplicarse.

---

## Hallazgos por área

### Entrada y sesión

- `/` redirige según sesión y `onboarding_completed` (`lib/onboardingGate.ts`): comportamiento coherente.
- Fail-closed a bienvenida si no se lee perfil: seguro; el usuario puede no entender por qué “vuelve” a la intro.

### Onboarding

- Wizard con puntos de progreso y **Saltar introducción** reduce barrera.
- Secuencia larga (emoción → energía → …): adecuada al producto; puede fatigar a quien busca “una pantalla y listo”.

### Pestañas

- Seis destinos en barra inferior: memorización y exploración necesarias.
- **Semana** / **Consejos** con premium: mensajes deben seguir siendo utilidad-first (el patrón `PremiumLock` en Semana orienta a beneficios concretos).

### Tareas (`vaciar`)

- Marca poética (“Vacía tu mente…”) vs función literal: placeholder, FAQ y hint «opcional» compensan.

### Sentir

- Emojis y opciones escaneables; flujo hacia energía/tiempo/foco alineado con onboarding cuando viene `from: sentir`.

### Hoy (`(tabs)/index`)

- Primera visita al día calendario: **vista lite** (menos bloques) + banner para **mostrar todo**; día siguiente o opt-out → vista completa.

### Ayuda

- FAQ sólido; acceso desde **Yo**, **Hoy** y **Sentir** (cabecera).

### Consistencia de lenguaje

- “Sentir” vs “check-in”: los textos que dicen “check-in en Sentir” unen bien ambos términos.
- Ejemplos en femenino: valorar neutralidad si el público es mixto.

---

## Recomendaciones priorizadas (estado)

### Alta — implementadas (2026-05-02)

1. **FlowIndicator vs pestañas** — Leyenda «Orden sugerido para tu día»; sin números; estados visuales por paso (`components/FlowIndicator.tsx`).
2. **Ayuda desde Hoy/Sentir** — `CircleHelp` → `/help` (`app/(tabs)/index.tsx`, `app/(tabs)/sentir.tsx`).
3. **Primera captura en Tareas** — Tarjeta «Todo lo demás es opcional» (`app/(tabs)/vaciar.tsx`).

### Media — implementadas (2026-05-02)

4. **Tour primera sesión** — `FirstSessionTourModal`, `lib/firstSessionTour.ts`, `app/(tabs)/_layout.tsx`.
5. **Hoy lite día 1** — `lib/hoyLiteDay.ts`, reglas en `app/(tabs)/index.tsx`.

### Baja prioridad / validación

6. **Tests de usuario** (5 personas): tarea tipo “primer día estresado…” — pendiente fuera de código.

7. ~~**Refactor Hoy**~~ → **Hecho (2026-05-19):** lista de tareas, tarjetas emocionales y modales extraídos a `components/hoy/` (`HoyTasksSection`, `HoyScreenOverlays`, cards); `app/(tabs)/index.tsx` ~1.3k líneas (orquestación + estado). Binario iOS: **build 26** — [guía TestFlight](2026-05-19_testflight_build_26.md).

---

## Checklist de implementación

### Quick wins (UX copy / navegación)

- [x] Diseño FlowIndicator vs orden de tabs documentado arriba y en código.
- [x] Entrada a `/help` desde Hoy y Sentir.
- [x] Revisión de copy entre FlowIndicator, tarjeta «Cómo funciona Koraa», tour y banner lite: **mensajes complementarios** (mismo flujo Tareas → Sentir → Hoy desde ángulos distintos); sin contradicción funcional. Repetición educativa del tour es intencional la primera sesión.

### Tareas / primera experiencia

- [x] Criterio sin tareas + hint opcional + coordinación con tooltip (`vaciar.tsx`).

### Onboarding opcional / Hoy

- [x] Tour + Hoy lite.

### Validación

- [ ] Probar flujo completo en **Expo Go** (iOS/Android): login → Tareas → Sentir → Hoy (ver sección abajo).
- [ ] **TestFlight build 26** en iPhone físico: checklist en [2026-05-19_testflight_build_26.md](2026-05-19_testflight_build_26.md).
- [ ] Revisar accesibilidad (VoiceOver / TalkBack) en Ayuda, tour, «Mostrar todo», hint Tareas.

### Documentación

- [x] Estado del informe actualizado a **Done**; archivo ubicado en `development_guidelines/delivered/`.
- [x] `CLAUDE.md` enlaza al informe y resume UX implementado.

---

## Probar en Expo Go (desarrollo local)

**Requisitos:** Node/npm instalados, app **Expo Go** en el teléfono (misma red Wi‑Fi que el Mac, o túnel si no hay LAN).

1. En la raíz del repo: `npm install` (si hace falta).
2. Variables: tener `.env` con `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` (ver `npm run env:bootstrap` / proyecto).
3. Arrancar Metro:
   ```bash
   npm run dev
   ```
   Alternativa estable en iPhone (sin depender de LAN): `npm run dev:cf` (Metro + túnel Cloudflare).
4. En la terminal aparece un **QR**. En **iPhone**, Cámara o app Expo Go → *Scan QR code*. En **Android**, Expo Go → *Enter URL* o escanear QR.
5. Si el teléfono no ve el PC (red corporativa, etc.):
   ```bash
   npm run dev:tunnel
   ```
   (puede tardar más la primera vez.)

**Qué comprobar respecto a esta entrega:** tour al abrir tabs la primera vez; Ayuda desde Hoy/Sentir; hint en Tareas sin tareas; Hoy lite el primer día en Hoy + «Mostrar todo ahora»; `FlowIndicator` en Tareas y Sentir.

**Repetir tour / Hoy lite en la misma cuenta:** borrar datos de la app o las claves AsyncStorage relacionadas (`koraa_first_session_tour_seen_v1_*`, `koraa_hoy_*`, etc.) — solo para desarrollo.

---

## Referencias en código

| Área | Archivos relevantes |
|------|---------------------|
| Gate post-auth | `app/index.tsx`, `lib/onboardingGate.ts` |
| Tabs + auth | `app/(tabs)/_layout.tsx` |
| Indicador de flujo | `components/FlowIndicator.tsx` |
| Tareas | `app/(tabs)/vaciar.tsx`, `components/projects/ProjectSelector.tsx` |
| Sentir | `app/(tabs)/sentir.tsx`, `app/onboarding/energy.tsx`, … |
| Hoy | `app/(tabs)/index.tsx`, `components/hoy/*` |
| FAQ | `app/help.tsx` |
| Ayuda desde perfil | `app/(tabs)/yo.tsx` |
| Ayuda desde flujo principal | Cabecera **Hoy** y **Sentir** → `router.push('/help')` |
| Tour primera sesión | `components/onboarding/FirstSessionTourModal.tsx`, `lib/firstSessionTour.ts`, `app/(tabs)/_layout.tsx` |
| Hoy lite día 1 | `lib/hoyLiteDay.ts`, `app/(tabs)/index.tsx` |

---

## Rationale

Invertir en claridad del **primer día** y en **coherencia del orden recomendado** reduce abandono antes de que el usuario vea el valor de priorización emocional. El FAQ ya existía; multiplicar puntos de entrada a Ayuda y simplificar la primera experiencia en Hoy/Tareas refuerza descubribilidad sin duplicar contenido en código nuevo masivo.
