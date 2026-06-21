# Tasks Experience — Adaptive Vision (Jun 2026)

**Status:** Phase 3 — drag-and-drop, mes, IA, Capturar (entregado)

## Phase 3

| Pieza | Archivo |
|-------|---------|
| Drag entre días | `WeekPlannerDragBoard`, `DraggablePlannerTask` |
| Vista mes | `MonthPlannerView`, `lib/lifeAreas/monthPlanner.ts` |
| IA reorganización | `supabase/functions/adaptive-reorganize`, `lib/adaptiveReorganizeAi.ts` |
| Flujo en Capturar | `CaptureAdaptivePanel` en `vaciar.tsx` |
| CTA en Proyectos | `AdaptiveExperienceProjectsCta` |

- Semana: columnas horizontales con arrastre (long-press + drag).
- Mes: calendario con densidad de pasos; tap → vista día.
- IA: si `EXPO_PUBLIC_HOY_COACH_AI_ENABLED=true` y función desplegada; fallback heurístico.
- Capturar: panel principal bajo el hero (cuando no estás escribiendo).
- Proyectos: enlace a Capturar en lugar del showcase embebido.

## Not implemented yet

- Drag en vista día / timeline
- Desplegar `adaptive-reorganize` en Supabase producción (`npm run deploy:adaptive-reorganize`)  
**Reference mockup:** `assets/Captura_de_pantalla_2026-06-18...png`

## Product promise

> When life changes, your plan should change too.

Reorganize in under 10 seconds. Less anxiety, less planning, more clarity.

## Interactive flow (Tareas → Proyectos)

1. **Brain dump** — floating pastel cards (`BrainDumpPanel`, `BrainDumpCanvas`)
2. **¿Qué cambió?** — supportive modal (`WhatChangedSheet`)
3. **Transition** — chaos → clarity (`ChaosToClarityTransition`)
4. **Success** — moved / kept + freed hours (`ReorganizeSuccessPanel`)
5. **Week view** — adaptive planner (`WeekPlannerView`) + día con timeline (`DayTimelineView`)

Orchestrator: `KoraaAdaptiveExperience` + `useAdaptiveExperience` inside `TasksExperienceShowcase`.

## Phase 2 (datos reales)

| Pieza | Archivo |
|-------|---------|
| Mapeo proyectos → áreas | `lib/lifeAreas/projectToLifeArea.ts` |
| Motor reorganización | `lib/lifeAreas/experienceDataMappers.ts` → `buildAdaptiveReorganizePlan` |
| Hook + Supabase | `hooks/useAdaptiveExperience.ts` |
| Mover entre días | `MoveTaskToDaySheet` + long-press en `WeekPlannerTaskRow` |
| Timeline diario | `DayTimelineView` (modo Día) |
| Tests | `lib/__tests__/adaptiveReorganize.test.ts` |

- Con sesión y tareas abiertas: carga real desde `tasks` + `projects`.
- Sin tareas: banner de datos de ejemplo (`VISION_*` mock).
- Reorganizar actualiza `scheduled_date` en Supabase.
- Mover tarjeta entre días persiste `scheduled_date`.

## Component map

See `components/tasks/experience/index.ts` for full exports.

## Not implemented yet

- Drag-and-drop between days (solo long-press → sheet)
- Real AI reorganization (heurísticas locales por `WhatChangedReason`)
- Vista mes del planner (UI-only)
- Mover experiencia a tab Capturar como flujo principal
