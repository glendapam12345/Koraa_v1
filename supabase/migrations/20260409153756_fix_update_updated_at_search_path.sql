/*
  # Fix mutable search_path for update_updated_at_column

  Hardening de seguridad:
  - Reemplaza la función para fijar search_path explícito
  - Evita dependencia del search_path del rol invocador
*/

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;;
