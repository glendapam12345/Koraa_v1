# Error PGRST204: columna `project_id` no existe en `tasks`

**Error que ves:** Al guardar una tarea (sobre todo si eliges un proyecto o "Mi lista" en Vaciar):

```
Could not find the 'project_id' column of 'tasks' in the schema cache
```

**Causa:** La tabla `tasks` en tu proyecto de Supabase no tiene la columna `project_id`. La app usa esa columna para asociar tareas a proyectos o a "Mi lista" (cuando es `null`).

---

## Solución: ejecutar la migración completa

1. Entra en **[Supabase Dashboard](https://supabase.com/dashboard)** y abre tu proyecto.
2. Ve a **SQL Editor** → Nueva query.
3. Abre en tu repo el archivo:
   `supabase/migrations/20260212000000_add_projects_and_weekly_scheduling.sql`
4. Copia **todo** su contenido y pégalo en la query.
5. Pulsa **Run** (o Ctrl+Enter).

Esa migración:

- Crea la tabla `projects` (si no existe).
- Añade a `tasks`: `project_id`, `scheduled_date` y `project_priority`.
- Crea índices y políticas RLS necesarias.

Después de ejecutarla, el error PGRST204 debería desaparecer y podrás guardar tareas con proyecto o en "Mi lista" desde Vaciar.

---

## Si ya agregaste solo `scheduled_date`

Si antes ejecutaste solo el snippet de `scheduled_date` (por ejemplo el de `AGREGAR_SCHEDULED_DATE_SUPABASE.md`), la tabla `tasks` sigue sin `project_id`. En ese caso puedes:

- **Opción A (recomendada):** Ejecutar la migración completa anterior; `ADD COLUMN IF NOT EXISTS` no rompe si `scheduled_date` ya existe.
- **Opción B:** Añadir solo la columna y el índice de proyecto:

```sql
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
```

Para la opción B necesitas que la tabla `projects` exista (también está en la migración completa).

---

**Última actualización:** febrero 2026
