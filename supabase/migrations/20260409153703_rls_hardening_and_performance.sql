/*
  # RLS hardening and performance optimization

  Objetivos:
  - Estandarizar políticas RLS al patrón recomendado de Supabase:
      (select auth.uid())
  - Mantener roles explícitos (TO authenticated)
  - Completar CRUD faltante en profiles (DELETE)
  - Asegurar índices en columnas usadas por políticas RLS
  - Mantener migración idempotente
*/

begin;

-- =========================
-- profiles (owner by id)
-- =========================
alter table if exists public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can delete own profile" on public.profiles;

create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Users can delete own profile"
  on public.profiles for delete
  to authenticated
  using ((select auth.uid()) = id);

-- PK index already exists on profiles(id).

-- =========================
-- daily_check_ins
-- =========================
alter table if exists public.daily_check_ins enable row level security;

drop policy if exists "Users can view own check-ins" on public.daily_check_ins;
drop policy if exists "Users can insert own check-ins" on public.daily_check_ins;
drop policy if exists "Users can update own check-ins" on public.daily_check_ins;
drop policy if exists "Users can delete own check-ins" on public.daily_check_ins;

create policy "Users can view own check-ins"
  on public.daily_check_ins for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own check-ins"
  on public.daily_check_ins for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own check-ins"
  on public.daily_check_ins for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own check-ins"
  on public.daily_check_ins for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create index if not exists idx_daily_check_ins_user_id
  on public.daily_check_ins(user_id);

-- =========================
-- tasks
-- =========================
alter table if exists public.tasks enable row level security;

drop policy if exists "Users can view own tasks" on public.tasks;
drop policy if exists "Users can insert own tasks" on public.tasks;
drop policy if exists "Users can update own tasks" on public.tasks;
drop policy if exists "Users can delete own tasks" on public.tasks;

create policy "Users can view own tasks"
  on public.tasks for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own tasks"
  on public.tasks for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own tasks"
  on public.tasks for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own tasks"
  on public.tasks for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create index if not exists idx_tasks_user_id
  on public.tasks(user_id);

-- =========================
-- projects
-- =========================
alter table if exists public.projects enable row level security;

drop policy if exists "Users can view own projects" on public.projects;
drop policy if exists "Users can insert own projects" on public.projects;
drop policy if exists "Users can update own projects" on public.projects;
drop policy if exists "Users can delete own projects" on public.projects;

create policy "Users can view own projects"
  on public.projects for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own projects"
  on public.projects for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own projects"
  on public.projects for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own projects"
  on public.projects for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create index if not exists idx_projects_user_id
  on public.projects(user_id);

-- =========================
-- meditations
-- =========================
alter table if exists public.meditations enable row level security;

drop policy if exists "Users can view own meditations" on public.meditations;
drop policy if exists "Users can create own meditations" on public.meditations;
drop policy if exists "Users can insert own meditations" on public.meditations;
drop policy if exists "Users can update own meditations" on public.meditations;
drop policy if exists "Users can delete own meditations" on public.meditations;

create policy "Users can view own meditations"
  on public.meditations for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own meditations"
  on public.meditations for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own meditations"
  on public.meditations for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own meditations"
  on public.meditations for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create index if not exists idx_meditations_user_id
  on public.meditations(user_id);

-- =========================
-- app_events (if table exists in target env)
-- =========================
do $$
begin
  if exists (
    select 1
    from pg_tables
    where schemaname = 'public' and tablename = 'app_events'
  ) then
    execute 'alter table public.app_events enable row level security';

    execute 'drop policy if exists "Users can select own app_events" on public.app_events';
    execute 'drop policy if exists "Users can insert own app_events" on public.app_events';
    execute 'drop policy if exists "Users can update own app_events" on public.app_events';
    execute 'drop policy if exists "Users can delete own app_events" on public.app_events';

    execute 'create policy "Users can select own app_events"
      on public.app_events for select
      to authenticated
      using ((select auth.uid()) = user_id)';

    execute 'create policy "Users can insert own app_events"
      on public.app_events for insert
      to authenticated
      with check ((select auth.uid()) = user_id)';

    execute 'create policy "Users can update own app_events"
      on public.app_events for update
      to authenticated
      using ((select auth.uid()) = user_id)
      with check ((select auth.uid()) = user_id)';

    execute 'create policy "Users can delete own app_events"
      on public.app_events for delete
      to authenticated
      using ((select auth.uid()) = user_id)';

    execute 'create index if not exists idx_app_events_user_id on public.app_events(user_id)';
  end if;
end $$;

commit;;
