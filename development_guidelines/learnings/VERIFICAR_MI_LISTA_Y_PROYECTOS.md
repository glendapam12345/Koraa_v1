# Cómo verificar Mi lista y proyectos en la app

Después de ejecutar la migración de Supabase (`20260212000000_add_projects_and_weekly_scheduling.sql`), sigue estos pasos para comprobar que todo funciona.

---

## Antes de probar

1. **Servidor corriendo:** `npm run dev` y abre la app (web con `w`, iOS con `i` o Android con `a`).
2. **Sesión iniciada:** entra con tu cuenta en la app.

---

## Paso 1: Guardar una tarea en Mi lista

1. Ve a la pestaña **Vaciar**.
2. En **"¿En qué lista? (opcional)"** deja la opción **Mi lista** (o no selecciones ningún proyecto).
3. Escribe una tarea, por ejemplo: `Comprar leche`.
4. Pulsa el botón para agregar.
5. Debe guardarse **sin error** y mostrarse un mensaje de éxito (toast).

---

## Paso 2: Guardar una tarea en un proyecto

1. Sigue en **Vaciar**.
2. En **"¿En qué lista? (opcional)"** abre el selector y elige **un proyecto** (o créalo antes en la pestaña Yo / Proyectos si no tienes).
3. Escribe otra tarea, por ejemplo: `Revisar diseño del logo`.
4. Pulsa agregar.
5. Debe guardarse **sin error**.

---

## Paso 3: Ver en Inicio (Hoy)

1. Ve a la pestaña **Hoy** (Inicio).
2. Debes ver:
   - Una sección **"Mi lista"** con la tarea que guardaste sin proyecto (ej. *Comprar leche*).
   - Una sección con el **nombre de tu proyecto** y la tarea que guardaste en ese proyecto (ej. *Revisar diseño del logo*).

Si ves esas dos secciones y las tareas correctas en cada una, la funcionalidad de Mi lista y proyectos está funcionando bien.

---

## Si algo falla

- **Error al guardar (PGRST204 / project_id):** la migración no se aplicó. Vuelve a ejecutar en Supabase SQL Editor todo el contenido de `supabase/migrations/20260212000000_add_projects_and_weekly_scheduling.sql`. Ver [ERROR_PGRST204_PROJECT_ID_TASKS.md](ERROR_PGRST204_PROJECT_ID_TASKS.md).
- **No aparece el selector de lista:** asegúrate de estar logueado; el selector solo se muestra si hay usuario.
- **No tengo proyectos:** crea uno desde la pestaña **Yo** (o donde esté la gestión de proyectos) y luego repite el Paso 2.

---

**Última actualización:** febrero 2026
