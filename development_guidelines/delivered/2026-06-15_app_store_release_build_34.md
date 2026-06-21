# App Store — release 1.0.3 (build 34)

**Fecha:** 2026-06-15  
**Estado:** IPA subido a App Store Connect; pendiente ficha + revisión Apple.

---

## Build en App Store Connect

| Campo | Valor |
|-------|--------|
| Versión marketing | `1.0.3` |
| Build iOS | `34` |
| Bundle ID | `com.impermanencecasaartisitca.koraav1` |
| ASC App ID | `6762663394` |
| EAS Build | `51d09308-ea0b-4fc2-a8c2-3183bd634d0c` |
| EAS Submit | `ecb2ba2b-3c76-40ad-a5d1-d7737c78313a` |
| TestFlight / ASC | https://appstoreconnect.apple.com/apps/6762663394/testflight/ios |

Espera el email de Apple («Processing complete») antes de asignar el build a la versión en revisión.

---

## Checklist App Store Connect (ficha pública)

### 1. Versión 1.0.3

- [ ] **App Store → iOS App → 1.0.3** (crear versión si no existe)
- [ ] Asignar **build 34** cuando termine el procesamiento
- [ ] **Novedades de esta versión** (ES + EN si aplica), p. ej.:
  - Proyectos en Tareas, quick-add de pasos, mejoras de rendimiento, Para mí y calendario.

### 2. Metadata (copiar y ajustar)

**Copy listo para pegar (ES + EN):** [2026-06-15_app_store_copy_v103.md](./2026-06-15_app_store_copy_v103.md)

Base histórica: [KORAA_APP_STORE_METADATA.md](./KORAA_APP_STORE_METADATA.md) (reemplazar por el doc v1.0.3 arriba).

### 3. Capturas (obligatorio)

Mínimo por tamaño requerido en ASC (típico iPhone 6.7" y 6.5"). Textos sugeridos en metadata doc §6.

Pantallas recomendadas:

1. Hoy — check-in + pasos sugeridos  
2. Tareas — captura / proyectos  
3. Calendario (Semana)  
4. Para mí — patrones (vista Premium o preview)  
5. Consejos  
6. Paywall (opcional; muestra trial + restaurar)

### 4. Categorías y edad

- **Principal:** Productividad o Estilo de vida (bienestar suave)  
- **Secundaria:** Salud y forma física (si el cuestionario encaja)  
- **Edad:** 12+ (bienestar emocional, sin diagnóstico clínico) — ver metadata §9

### 5. URLs legales (deben coincidir con la app)

| Uso | URL |
|-----|-----|
| Privacidad | https://koradelcaosalacalma.lovable.app/privacy |
| Términos | https://koradelcaosalacalma.lovable.app/terms |
| Soporte | `koraa.founder@yahoo.com.mx` (mailto en app) |

Verificar que EAS production tenga `EXPO_PUBLIC_PRIVACY_POLICY_URL` y `EXPO_PUBLIC_TERMS_OF_SERVICE_URL` (ya cargadas en el último build).

### 6. Suscripciones (App Review)

- [ ] Productos en App Store Connect alineados con RevenueCat (`premium` entitlement)
- [ ] **Prueba gratuita 7 días** activa en ASC si el paywall la promete
- [ ] Grupo de suscripciones con enlace a términos y privacidad
- [ ] Botón **Restaurar compras** visible en paywall (ya en app)
- [ ] Metadata de suscripción: qué desbloquea (calendario 7 días, Para mí patrones, consejos ilimitados, Emergency Kit)

### 7. Privacidad de la app (nutrition labels)

Declarar según uso real:

| Dato | Uso |
|------|-----|
| Email / identificador | Cuenta Supabase |
| Check-ins, tareas | Funcionalidad core |
| Eventos de producto | `app_events` (analytics opcional) |
| Compras | RevenueCat / App Store |
| Salud (opcional) | HealthKit sueño — solo si el usuario conecta |
| Micrófono | Dictado de tareas (no se guardan grabaciones) |
| Calendario | Exportar tareas a eventos |
| Fotos | Emergency Kit — solo cuando el usuario elige |

### 8. App Review — notas para el revisor

Incluir en **App Review Information**:

```
Koraa es bienestar emocional suave + pasos sugeridos (no productividad rígida).

Flujo de prueba:
1. Crear cuenta o iniciar sesión.
2. Tab Tareas: capturar un paso (opcional: asignar proyecto).
3. Tab Hoy: check-in rápido → ver pasos sugeridos.
4. Tab Para mí: patrones (Premium muestra gráficas; gratis ve preview).
5. Premium: Tu espacio → Ajustes → Premium (suscripción / restaurar).

Cuenta de prueba (si aplica): [email] / [contraseña]

HealthKit: opcional; lee sueño para contexto en Hoy.
Emergency Kit: Premium; apoyo emocional, no sustituye ayuda profesional.
```

- [ ] Usuario/contraseña de demo si la app requiere login
- [ ] Contacto: `koraa.founder@yahoo.com.mx`

### 9. Export compliance

`ITSAppUsesNonExemptEncryption: false` en `app.config.js` — en ASC suele ser **No** (solo HTTPS estándar).

### 10. TestFlight antes de revisión pública (recomendado)

- [ ] Probar build 34 en dispositivo real (check-in, tareas, proyectos, paywall, restaurar)
- [ ] Confirmar enlaces privacidad/términos abren en Safari
- [ ] Internal testing OK → **Submit for Review**

---

## Comandos (referencia)

```bash
# Build ya hecho (34). Si necesitas otro build:
npx eas build --platform ios --profile production

# Submit (ya hecho para build 34):
npx eas submit --platform ios --profile production --latest

# Salud del proyecto antes de otro release:
npx expo-doctor && npm run typecheck && npx expo export --platform ios
```

---

## Relacionado

- [KORAA_APP_STORE_METADATA.md](./KORAA_APP_STORE_METADATA.md)  
- [KORAA_TERMS_OF_USE.md](./KORAA_TERMS_OF_USE.md)  
- [KORAA_HELP_AND_LEGAL_URLS.md](../learnings/KORAA_HELP_AND_LEGAL_URLS.md)  
- [2026-06-04_testflight_version_train_closed.md](../learnings/2026-06-04_testflight_version_train_closed.md)
