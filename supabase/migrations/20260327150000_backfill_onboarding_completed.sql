-- Marca onboarding completado para cuentas ya existentes antes del gate en app.
-- Los nuevos registros siguen con onboarding_completed = false (trigger handle_new_user).

UPDATE public.profiles SET onboarding_completed = true;
