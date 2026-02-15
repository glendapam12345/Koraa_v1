# Agregar la columna `scheduled_date` en Supabase

**Error que ves:** `column tasks.scheduled_date does not exist`

**Causa:** En tu proyecto de Supabase la tabla `tasks` no tiene la columna `scheduled_date`, que la app usa para la pestaña Semana (tareas por día).

---

## Solución rápida (solo la columna)

1. Entra en **[Supabase Dashboard](https://supabase.com/dashboard)** y abre tu proyecto.
2. En el menú izquierdo, ve a **SQL Editor**.
3. Crea una nueva query y pega **exactamente** esto:

```sql
-- Agregar columna para programar tareas por día (pestaña Semana)
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS scheduled_date date;

-- Índice para que las consultas de la semana sean rápidas
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled 
ON tasks(user_id, scheduled_date, is_completed) 
WHERE scheduled_date IS NOT NULL;
```

4. Pulsa **Run** (o Ctrl+Enter).
5. Deberías ver algo como "Success. No rows returned".
6. En la app: cierra el toast de error y **arrastra hacia abajo** en la pestaña Semana para recargar (pull to refresh), o vuelve a abrir la pestaña.

Después de esto la pestaña Semana debería cargar sin ese error.

---

## Si además quieres proyectos y prioridad por proyecto

Si más adelante quieres usar **proyectos** y **prioridad por proyecto**, puedes ejecutar la migración completa desde el mismo SQL Editor. El archivo está en:

`supabase/migrations/20260212000000_add_projects_and_weekly_scheduling.sql`

Copia todo su contenido en una nueva query y ejecútala. Eso crea la tabla `projects` y agrega `project_id` y `project_priority` a `tasks` (y ya incluye `scheduled_date`).

---

**Última actualización:** febrero 2026
