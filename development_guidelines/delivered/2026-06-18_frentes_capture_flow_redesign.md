# Frentes Capture Flow Redesign (Jun 2026)

**Status:** Delivered (v1 UX)

## Concept

**Frentes** replace rigid categories (Work/Personal/Health). A frente is whatever currently occupies mental space — Koraa, Impermanence, Familia, Finanzas, etc.

## Flow

1. **Brain dump** — `CaptureScreenHero` + `VaciarCaptureForm` + live `FrentesLivePreview`
2. **Front detection** — `FrontDetectionScreen` ("Entendido, {{name}}")
3. **Weekly plan** — `WeeklyPlanReadyScreen` after `buildWeeklyPlanPreview`
4. **Done** — `CaptureSavedNextStep`

## Components

| Component | Path |
|-----------|------|
| FrenteChip | `components/frentes/FrenteChip.tsx` |
| FrentesSection | `components/frentes/FrentesSection.tsx` |
| FrontGroupCard | `components/frentes/FrontGroupCard.tsx` |
| FrentesLivePreview | `components/frentes/FrentesLivePreview.tsx` |
| CreateFrenteModal | `components/frentes/CreateFrenteModal.tsx` |
| FrontDetectionScreen | `components/frentes/FrontDetectionScreen.tsx` |
| WeeklyPlanReadyScreen | `components/frentes/WeeklyPlanReadyScreen.tsx` |

## Lib

- `lib/frentes/frontTheme.ts` — pastel colors per frente key
- `lib/frentes/buildWeeklyPlanPreview.ts` — distributes tasks into week columns

## i18n

Keys under `frentes.*` in `bundle-ext.es.ts` / `bundle-ext.en.ts`.

## Not in v1

- Drag tasks on weekly plan screen (use Semana tab / adaptive experience)
- Persist custom emoji on projects (emoji is visual in modal only)
- "Reorganize week" prompt on single task move (future)
