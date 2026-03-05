# Habilitar proyectos en Supabase

**Problema:** Al crear un proyecto en la app aparece: *"No se pudo crear el proyecto. Falta la tabla de proyectos en la base de datos (ejecuta la migración en Supabase)."*

**Causa:** La migración que crea la tabla `projects` y añade `project_id` a `tasks` no se ha ejecutado en tu proyecto de Supabase.

## Solución: ejecutar la migración

### Opción A – Supabase Dashboard (recomendado)

1. Entra en [Supabase Dashboard](https://supabase.com/dashboard) y abre tu proyecto.
2. En el menú izquierdo, ve a **SQL Editor**.
3. Pulsa **New query**.
4. Copia y pega **todo** el contenido del archivo:
   ```
   supabase/migrations/20260212000000_add_projects_and_weekly_scheduling.sql
   ```
5. Pulsa **Run** (o Ctrl/Cmd + Enter).
6. Debe aparecer “Success” o “Success. No rows returned”.
7. Cierra el modal en la app y vuelve a intentar crear un proyecto.

### Opción B – Supabase CLI

Si tienes el proyecto enlazado con Supabase CLI:

```bash
supabase db push
```

O aplicar solo esta migración según la documentación de tu versión del CLI.

## Qué hace la migración

- Crea la tabla **`projects`** (id, user_id, name, color, priority, etc.) con RLS.
- Añade a **`tasks`** las columnas: `project_id`, `scheduled_date`, `project_priority`.
- Crea índices para consultas por proyecto y por fecha.

Después de ejecutarla, en la app podrás crear proyectos y asignar tareas a proyectos con normalidad.
