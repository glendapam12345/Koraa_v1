# Auditoría de flujo UX — Koraa (claridad y facilidad de uso)

**Fecha:** 2026-05-02  
**Estado:** In Progress  
**Prioridad:** Alta (impacto en primera experiencia y retención)  
**Relacionado con:** Navegación por pestañas, `FlowIndicator`, pantallas `vaciar`, `sentir`, `(tabs)/index` (Hoy), `help.tsx`, onboarding.

---

## Resumen ejecutivo

Auditoría basada en revisión del código y copys (rutas, tabs, mensajes). No sustituye pruebas con usuarios reales.

### Fortalezas

- Onboarding comunica bien el diferencial (“organiza sintiendo…” + ejemplos energía baja/alta).
- FAQ en **Ayuda** (`app/help.tsx`) explica Sentir, Tareas, Hoy y datos de forma directa.
- **FlowIndicator** refuerza el orden ideal del día (Tareas → Sentir → Hoy).
- Copy en Hoy que aclara la racha (check-in en Sentir, no meditación) reduce frustración por expectativas equivocadas.

### Riesgos principales

- **Seis pestañas** + densidad de **Hoy** aumentan carga cognitiva para usuarios nuevos.
- **Desajuste**: barra inferior ordena Hoy → Tareas → Sentir → … pero el indicador numérico dice 1 Tareas, 2 Sentir, 3 Hoy (choque con “Hoy” como primera pestaña).
- **Ayuda** solo enlazada desde **Yo**: baja descubribilidad para quien no abre perfil.
- Flujo de **Tareas** (`vaciar`) es potente (proyecto, categoría, fecha, subtareas) y puede parecer largo si todo se percibe como obligatorio.

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
- Fail-closed a bienvenida si no se lee perfil: seguro; el usuario puede no entender por qué “vuelve” la intro.

### Onboarding

- Wizard con puntos de progreso y **Saltar introducción** reduce barrera.
- Secuencia larga (emoción → energía → …): adecuada al producto; puede fatigar a quien busca “una pantalla y listo”.

### Pestañas

- Seis destinos en barra inferior: memorización y exploración necesarias.
- **Semana** / **Consejos** con premium: mensajes deben seguir siendo utilidad-first (el patrón `PremiumLock` en Semana orienta a beneficios concretos).

### Tareas (`vaciar`)

- Marca poética (“Vacía tu mente…”) vs función literal: placeholder y FAQ compensan.
- Modal de proyecto: mejoras recientes de estado seleccionado visibles ayudan a claridad.

### Sentir

- Emojis y opciones escaneables; flujo hacia energía/tiempo/foco alineado con onboarding cuando viene `from: sentir`.

### Hoy (`(tabs)/index`)

- Pantalla más rica = mayor riesgo de sobrecarga el día 1; depende de jerarquía visual en dispositivo real.

### Ayuda

- FAQ sólido; **descubribilidad** limitada al menú de Yo.

### Consistencia de lenguaje

- “Sentir” vs “check-in”: los textos que dicen “check-in en Sentir” unen bien ambos términos.
- Ejemplos en femenino: coherentes si el público objetivo es mayoritariamente mujer; valorar neutralidad si el público es mixto.

---

## Recomendaciones priorizadas

### Alta prioridad

1. **Alinear FlowIndicator con la barra de pestañas**  
   Opciones: quitar números y usar solo etiquetas (“Tu día: Tareas → Sentir → Hoy”), o copiaría tipo “Orden sugerido” sin implicar que “Hoy” es “paso 3” en la UI principal.

2. **Enlace a Ayuda desde Hoy o Sentir**  
   Icono `?` en cabecera o línea “¿Cómo funciona Koraa?” que abra `/help`.

3. **Primera captura en Tareas**  
   Si no hay tareas aún, mini texto o acordeón “Opcional: proyecto, fecha, subtareas” para que no parezca todo obligatorio.

### Media prioridad

4. **Tour corto primera sesión** (overlay 3 pasos) alineado al flujo ideal.

5. **Reducir densidad de Hoy el día 1**  
   Ocultar o posponer bloques secundarios vía AsyncStorage / flag hasta segunda sesión.

### Baja prioridad / validación

6. **Tests de usuario** (5 personas): tarea tipo “primer día estresado: anota 3 cosas y dime qué hacer primero”; medir tiempo y confusiones en proyecto/fecha.

---

## Checklist de implementación

Usar esta lista al abordar mejoras; marcar ítems al completar.

### Quick wins (UX copy / navegación)

- [x] Decidir diseño final FlowIndicator vs orden de tabs (especificación en Figma o notas en este archivo). **Hecho (2026-05-02):** sin números 1–3; leyenda «Orden sugerido para tu día»; completado = check; actual = círculo azul con punto; pendiente = círculo vacío (`components/FlowIndicator.tsx`).
- [x] Añadir entrada a `/help` desde al menos una pantalla principal (Hoy y/o Sentir). **Hecho (2026-05-02):** icono `CircleHelp` en cabecera de `app/(tabs)/index.tsx` (junto a Ajustes) y `app/(tabs)/sentir.tsx` (arriba a la derecha antes del FlowIndicator).
- [ ] Revisar strings duplicados o contradictorios entre banner de Hoy y FlowIndicator tras el cambio de indicador.

### Tareas / primera experiencia

- [x] Definir criterio “usuario sin tareas” (`tasks` count 0 o equivalente). **Criterio:** `hasTasks === false` tras `checkIfFirstTime` (máx. 1 fila en `tasks`).
- [x] Implementar hint colapsable “Proyecto y fecha son opcionales” (o similar) en `vaciar` solo primera vez o hasta dismiss. **Hecho (2026-05-02):** tarjeta «Todo lo demás es opcional» en `app/(tabs)/vaciar.tsx`; expandir/contraer; `Entendido` + `AsyncStorage` por usuario (`VACIAR_OPTIONAL_HINT_DISMISSED_KEY`).
- [x] Verificar que tooltip existente en primera captura no compite con el nuevo hint (un solo mensaje prioritario). **Coordinación:** si hay hint visible (`!optionalHintDismissed`), `setShowTooltip(false)`; si el usuario ya cerró la tarjeta y sigue sin tareas, se restaura el tooltip modal como antes.

### Onboarding opcional / Hoy

- [x] Si se implementa tour: tres pasos con skip; persistir `hasSeenFlowTour` por usuario. **Hecho (2026-05-02):** `FirstSessionTourModal` + `lib/firstSessionTour.ts` (`koraa_first_session_tour_seen_v1_<userId>`); montado en `app/(tabs)/_layout.tsx` al entrar en tabs; pasos Tareas → Sentir → Hoy; «Omitir tour» / «Siguiente» / «Listo».
- [x] Si se implementa Hoy “lite” día 1: lista de componentes a ocultar y condición de día/sesión. **Hecho (2026-05-02):** `lib/hoyLiteDay.ts` — primer **día calendario** en que se abre Hoy (`koraa_hoy_first_open_calendar_day_v1_<userId>`); si `hoy_lite` activo: sin meditación, recomendaciones, «Más sobre tu orden», loop emocional, memoria semanal, filtros Solo hoy/Todas, aliviar carga, resumen por proyecto; banner con «Mostrar todo ahora» → `koraa_hoy_lite_opt_out_v1_<userId>`.

### Validación

- [ ] Probar flujo completo en iOS y Android (o web): login → primera tarea → Sentir → Hoy.
- [ ] Revisar accesibilidad de nuevos botones (labels en Ayuda / tour).

### Documentación

- [ ] Actualizar este archivo **Estado** a “In Progress” / “Done” cuando corresponda.
- [ ] Si el cambio de FlowIndicator es decisión de producto permanente, añadir una línea breve en `CLAUDE.md` bajo notas de UX (opcional).

---

## Referencias en código

| Área | Archivos relevantes |
|------|---------------------|
| Gate post-auth | `app/index.tsx`, `lib/onboardingGate.ts` |
| Tabs + auth | `app/(tabs)/_layout.tsx` |
| Indicador de flujo | `components/FlowIndicator.tsx` |
| Tareas | `app/(tabs)/vaciar.tsx`, `components/projects/ProjectSelector.tsx` |
| Sentir | `app/(tabs)/sentir.tsx`, `app/onboarding/energy.tsx`, … |
| Hoy | `app/(tabs)/index.tsx` |
| FAQ | `app/help.tsx` |
| Ayuda desde perfil | `app/(tabs)/yo.tsx` |
| Ayuda desde flujo principal | Cabecera **Hoy** y **Sentir** → `router.push('/help')` |
| Tour primera sesión | `components/onboarding/FirstSessionTourModal.tsx`, `lib/firstSessionTour.ts`, `app/(tabs)/_layout.tsx` |
| Hoy lite día 1 | `lib/hoyLiteDay.ts`, `app/(tabs)/index.tsx` |

---

## Rationale

Invertir en claridad del **primer día** y en **coherencia visual del orden recomendado** reduce abandono antes de que el usuario vea el valor de priorización emocional. El FAQ ya existe; hacerlo **encontrable** multiplica su utilidad sin escribir contenido nuevo.
