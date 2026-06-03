# P3 UX — Contraste tipográfico y meditación en Expo Go

**Fecha:** 2026-05-19  
**Estado:** Entregado  
**Relacionado:** [2026-05-19_ui_ux_design_audit.md](./2026-05-19_ui_ux_design_audit.md), [MEDITACION_SACA_DE_LA_APP.md](../learnings/MEDITACION_SACA_DE_LA_APP.md)

---

## Objetivo

Cerrar ítems **P3** de la auditoría UI/UX:

1. Mejorar contraste de textos `meta` y hints sobre fondos claros (`fill[200]`).
2. Informar en UI que la meditación en **Expo Go** es una vista simplificada (funcionalidad intacta).

---

## Cambios

### Design system (`constants/theme.ts`)

- `text.tertiary`: `#999999` → `#707070` (iconos, chevrons, separadores).
- Nuevo token `text.metaOnFill`: `#595959` (mismo que `secondary`) para párrafos meta sobre `fill[200]` (~4.5:1 WCAG AA a 13px).
- `typography.meta` incluye `color: #595959` por defecto.

### Componentes (contraste)

- `FlowIndicator` — `stepHint` usa `metaOnFill`.
- `app/onboarding/emotion.tsx` — nota inclusiva usa `metaOnFill`.
- `components/hoy/hoyTasksSectionStyles.ts` — hints/meta en tarjetas de tareas.
- `components/tasks/TasksFlowCard.tsx` — texto de flujo en Tareas.

### Meditación Expo Go

- `lib/meditationEnvironment.ts` — `showsSimplifiedMeditationNotice()` delega en `isExpoGoClient()`.
- `components/hoy/HoyMeditationCard.tsx` — banner con icono `Info` y copy `hoy.meditationExpoGoNote` cuando aplica.
- i18n: `bundle.es.ts` / `bundle.en.ts` — clave `hoy.meditationExpoGoNote`.
- Test: `lib/__tests__/meditationEnvironment.test.ts`.

---

## Verificación

```bash
npm run typecheck
npm run check:copy
npm run test:unit -- lib/__tests__/meditationEnvironment.test.ts
npm run lint
```

---

## Notas

- En builds de producción (TestFlight / App Store) el banner **no** se muestra.
- La experiencia de meditación sigue usando `MeditationCircleSimple` en todos los entornos; el aviso solo aclara la diferencia visual en Expo Go.
