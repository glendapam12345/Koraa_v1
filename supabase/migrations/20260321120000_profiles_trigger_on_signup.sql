-- Crea la fila en public.profiles al registrarse en auth.users.
-- Evita el error "new row violates row-level security policy for table 'profiles'"
-- cuando el cliente hace INSERT sin sesión (p. ej. confirmación de email pendiente).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, onboarding_completed)
  VALUES (
    new.id,
    COALESCE(new.email, ''),
    NULLIF(TRIM(COALESCE(new.raw_user_meta_data->>'full_name', '')), ''),
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS 'Crea perfil al registrarse; corre con privilegios para evitar fallos RLS desde el cliente.';
