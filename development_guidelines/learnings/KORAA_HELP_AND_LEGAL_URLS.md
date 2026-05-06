# Ayuda en pantalla y URLs legales

**Fecha:** 2026-03-23  
**Propósito:** Documentar la pantalla `/help` y variables opcionales para políticas.

## Pantalla `app/help.tsx`

- Ruta Expo Router: `/help` (registrada en `app/_layout.tsx`).
- Desde **Yo → Ayuda** o **Ajustes → Ayuda** se navega con `router.push('/help')`.
- Incluye FAQ, enlaces a privacidad/términos (si hay URL) y **Contactar soporte** por `mailto`.

Si aún no tienes `.env` con Supabase, sigue primero [LOCAL_DEV_THREE_STEPS.md](./LOCAL_DEV_THREE_STEPS.md).

## Variables de entorno opcionales

En `.env` (o secretos EAS para builds):

| Variable | Uso |
|----------|-----|
| `EXPO_PUBLIC_PRIVACY_POLICY_URL` | URL HTTPS de la política de privacidad |
| `EXPO_PUBLIC_TERMS_OF_SERVICE_URL` | URL HTTPS de términos del servicio |

Si no están definidas, al pulsar el enlace la app indica que aún no hay URL pública y sugiere contacto por correo.

## URLs públicas en producción (referencia Koraa)

| Página | URL |
|--------|-----|
| Privacidad | [https://koradelcaosalacalma.lovable.app/privacy](https://koradelcaosalacalma.lovable.app/privacy) |
| Términos | [https://koradelcaosalacalma.lovable.app/terms](https://koradelcaosalacalma.lovable.app/terms) |

Copia esas URLs en `EXPO_PUBLIC_PRIVACY_POLICY_URL` y `EXPO_PUBLIC_TERMS_OF_SERVICE_URL` (y en secretos EAS del perfil `production`).

## Código relacionado

- `constants/legalUrls.ts` — lectura de URLs y `SUPPORT_EMAIL`.
