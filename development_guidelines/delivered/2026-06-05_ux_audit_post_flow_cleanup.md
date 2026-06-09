# Auditoría UX — Koraa (post flow cleanup)

**Fecha:** 2026-06-05  
**Estado:** Entregado (hallazgos + fixes 🔴 implementados)  
**Relacionado:**
- [2026-06-05_flow_audit_buttons_cleanup.md](./2026-06-05_flow_audit_buttons_cleanup.md)
- [2026-06-05_anti_pressure_ux_redesign.md](./2026-06-05_anti_pressure_ux_redesign.md)

---

## Resumen ejecutivo

| Área | Calificación | Veredicto |
|------|-------------|-----------|
| Filosofía / voz | ⭐⭐⭐⭐ | Copy mayormente compasivo; residuos de “prioridad” y gamificación |
| IA / navegación | ⭐⭐⭐⭐ | 4 tabs claras; Tareas oculta era el mayor hueco → **fix en cabecera Hoy** |
| Hoy | ⭐⭐⭐⭐ | Jerarquía sólida; lite banner reubicado arriba |
| Calendario | ⭐⭐⭐½ | Buen tono; doble nudge check-in; `focusCount` en día hoy |
| Para mí | ⭐⭐⭐ | Reflexión clara; premium con previews borrosos |
| Tu espacio | ⭐⭐⭐⭐ | Racha suavizada a “volviste hoy” |
| Design system | ⭐⭐⭐ | Tabs principales calm; stack secundario con gradientes |

**Diagnóstico:** Koraa ya suena como bienestar. Gap restante: copy legacy, premium en gráficas básicas, pantallas secundarias sin `CalmScreen`.

---

## Fixes 🔴 implementados (esta entrega)

| # | Problema | Solución |
|---|----------|----------|
| 1 | Tareas (`vaciar`) invisible en barra | `HoyScreenHeader` — icono Brain persistente + Ayuda en cabecera de Hoy |
| 2 | `app/checkin-summary.tsx` huérfana | Archivo eliminado |
| 3 | `HoyLiteBanner` debajo del contenido | Movido arriba del flujo principal en `index.tsx` |

Archivos: `components/hoy/HoyScreenHeader.tsx`, `app/(tabs)/index.tsx`, i18n `hoy.headerSubtitle`, `hoy.tasksCaptureA11y`.

---

## Lo que funciona bien

- Flujo canónico: Tareas → check-in Hoy → pasos → apoyo
- `HoyFocusPanel` — hero, pasos, `HoySupportPanel`, resto colapsado
- Tour 4 tabs; auth guard; paywall con `next`
- `YoStreakHero` — “Volviste hoy”
- Para mí simplificado + enlace `/tips/rest`

---

## Hallazgos pendientes

### 🟡 Media

| # | Item |
|---|------|
| 1 | Lite mode no oculta `HoySupportPanel` el día 1 |
| 2 | Calendario: banner global + empty soft sin check-in |
| 3 | `focusCount` en sección “hoy” del calendario |
| 4 | Copy: `prioridad`, `priorityHigh`, `toastPriorityAdded`, variable i18n `{{focos}}` |
| 5 | `FlowIndicator` en vaciar/sentir vs `HoyFlowLegend` en Hoy |
| 6 | Para mí free: gráficas bloqueadas con blur |
| 7 | Migrar Settings + Help a design system calm |

### 🟢 Baja

| # | Item |
|---|------|
| 8 | Prop `hoyLiteLayout` sin uso en `HoyTasksSection` |
| 9 | Renombrar `components/yo/*` usados en Para mí |
| 10 | Podar `streakPools.ts` / tono gamificado |
| 11 | QA manual + test con 5 usuarios |

---

## Pregunta guía para PRs

> *“¿Esto le diría a alguien agotada: ‘tal vez hoy sí puedo con esto’ — o le recordaría todo lo que no hizo?”*

---

## Verificación

```bash
npm run typecheck
npm run lint
```

Probar en Expo Go:
- Icono Brain en Hoy → abre Tareas
- Día 1 lite → banner arriba antes del contenido
- Deep link `/checkin-summary` → 404 (ruta eliminada)
