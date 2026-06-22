# Guía de demo ONU — Koraa (20 jun 2026)

**Propósito:** Script y checklist para presentación en vivo. Koraa es una app de bienestar emocional con pasos sugeridos (no productividad rígida).

**Pre-flight (30 min antes):**
- Internet estable (WiFi o datos buenos). Evitar modo avión.
- `npm run check:supabase` — debe pasar.
- Cuenta demo ya creada con onboarding completado y 3–5 tareas en áreas.
- Check-in del día ya hecho (para mostrar Hoy con pasos sugeridos).
- Build nativo o TestFlight (no Expo Go si hay duda de red/túnel).
- Cerrar y reabrir app una vez para verificar sesión persistente.

---

## 1. Onboarding y auth

| Acción | Cómo demostrarlo | Notas |
|--------|------------------|-------|
| Crear cuenta | Signup → email/contraseña → confirmar email si Supabase lo exige | Tener cuenta ya lista como backup |
| Login | Cerrar app → login con cuenta demo | |
| Logout | Tu espacio (yo) → cerrar sesión | |
| Volver a entrar | Login de nuevo | |
| Recuperar sesión | Cerrar app sin logout → reabrir | Sesión en SecureStore |
| **Evitar** | Recuperar contraseña con OTP en pantalla | El flujo envía magic link por email, no OTP en app |

**Si carga infinito al abrir:** botón Reintentar (timeout 15 s en gate de perfil).

---

## 2. Quick Capture (Tareas / Capturar)

Koraa no tiene entidades separadas “recordatorio” ni “nota”. Equivalencias para la audiencia:

| Checklist externo | En Koraa |
|-------------------|----------|
| Tarea | Brain dump → línea en captura |
| Proyecto | Área de revisión o asignar a proyecto |
| Recordatorio | Tarea con fecha (`scheduled_date`) |
| Nota | Notas en proyecto o texto en tarea |

**Script recomendado:**
1. Tab **Tareas** → escribir varias líneas (brain dump).
2. **Soltar** → revisión por áreas → mover/editar → **Confirmar**.
3. Tab **Áreas** (organizado) → ver tareas y proyectos.
4. Editar una tarea (tap) → eliminar otra (papelera en área/proyecto).

**Edge cases cubiertos hoy:**
- Campo vacío → no guarda, mensaje suave.
- Texto muy largo → límite 300 caracteres.
- Doble tap en confirmar → bloqueado mientras guarda o refina IA.
- Error de red al guardar → no muestra éxito falso.

---

## 3. Daily Plan (Hoy)

| Acción | Cómo |
|--------|------|
| Marcar completada | Tap en paso sugerido |
| Repriorizar | Mantener orden manual (drag) en lista de hoy |
| Persistencia | Salir de Hoy y volver; pull-to-refresh |

**No demostrar:** “desmarcar” tarea completada en Hoy (solo aparecen incompletas). Para ver completadas → Semana o Áreas.

**Requisito:** check-in del día hecho antes de mostrar pasos sugeridos.

---

## 4. Mood Check-in (Sentir)

1. Si no hay check-in: CTA en Hoy o modal Sentir.
2. Elegir emoción, energía, tiempo, foco.
3. Volver a Hoy → ver texto de recomendación adaptado.
4. Cambiar emoción: “¿Cómo te sientes ahora?” en Hoy.

**Demo online:** el impacto en recomendaciones es inmediato tras guardar en Supabase.

---

## 5. Calendar (Semana)

1. Tab **Semana** → vista semanal.
2. Cambiar semana (flechas) — esperar carga breve.
3. Crear: desde captura con fecha, o mover tarea a un día.
4. Editar: tap en tarea en el día.

---

## 6. AI Features (organización por áreas)

| Escenario | Comportamiento esperado |
|-----------|-------------------------|
| Mucho texto | IA divide en varias tareas/áreas; revisión antes de confirmar |
| Poco texto | Una o pocas tareas; organización simple |
| Nada escrito | Botón deshabilitado / mensaje “escribe algo” |
| Sin internet | Preview local o error; no confirmar éxito si no guardó |

**Durante refinamiento IA:** botón Confirmar deshabilitado.

---

## 7. Edge cases — “eso no puede pasar”

| Riesgo | Mitigación en build |
|--------|---------------------|
| Campos vacíos | Validación en captura y formularios |
| Botones dobles | `confirmInFlightRef`, `loading` en CTAs |
| Tap rápido | Guards en confirmar y soltar |
| Pantalla en blanco | Timeouts en gate perfil (15 s) y carga Hoy (12 s) + Reintentar |
| Loading infinito | Semana: última petición gana; Hoy: timeout + pull refresh |

---

## Orden de demo sugerido (8–10 min)

1. **Hook** — “Koraa ayuda a sentirse un poco más ligera, sin presión.”
2. **Captura** — brain dump → organizar por áreas de vida → confirmar.
3. **Check-in** — emoción del día (si no está hecho).
4. **Hoy** — pasos sugeridos → completar uno → reordenar otro.
5. **Semana** — ver tarea con fecha.
6. **Cierre** — logout opcional; mencionar privacidad y que el usuario controla el ritmo.

---

## Fixes aplicados para esta demo (20 jun 2026)

- Confirmar áreas solo tras guardado exitoso (`vaciar.tsx` + `useVaciarTaskSave`).
- Confirmar deshabilitado durante refinamiento IA.
- Anti doble-tap en confirmar batch.
- Timeout gate perfil 15 s (`index`, tabs layout).
- Timeout carga Hoy 12 s (`useTasks`, `useCheckIn`).
- Semana: cargas concurrentes no dejan datos obsoletos (`useWeekTasks`).

---

**Última actualización:** 20 junio 2026
