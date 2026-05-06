# Checklist de Microcopy: errores y reintentos

**Fecha:** 2026-05-06  
**Objetivo:** Estandarizar cómo escribimos mensajes de error, estado vacío y reintento en Koraa para mantener claridad y confianza.

---

## 1) Patrón oficial

Usar esta estructura en toasts, alerts y banners:

- **Error:** `No se pudo <acción>.`
- **Siguiente paso:** `Inténtalo de nuevo.`

Ejemplo completo:

- `No se pudo guardar la tarea. Inténtalo de nuevo.`

---

## 2) Mensajes aprobados (copiar/pegar)

### Guardado

- `No se pudo guardar la tarea. Inténtalo de nuevo.`
- `No se pudieron guardar los pasos. Inténtalo de nuevo.`

### Eliminación

- `No se pudo eliminar la tarea. Inténtalo de nuevo.`

### Carga / actualización

- `No se pudo actualizar. Inténtalo de nuevo.`
- `No se pudo cargar tu perfil. Inténtalo de nuevo.`

### Integraciones / funciones aún no activas

- **Evitar:** `No disponible` (suena definitivo y genera desconfianza).
- **Usar:** `en preparación` o `estará activa muy pronto`.
- Ejemplo: `Meditación en preparación. Esta función estará activa muy pronto en este entorno.`

---

## 3) Reglas rápidas

- No usar lenguaje técnico interno (códigos, nombres de tabla, siglas backend).
- Mantener frases cortas (1-2 oraciones).
- Siempre incluir una salida clara (`Inténtalo de nuevo`, `Ir a ...`, `Actualizar ...`).
- Mantener tono humano y calmado; nunca culpar al usuario.

---

## 4) CTAs de recuperación recomendados

- `Actualizar planes`
- `Reintentar`
- `Ir a Tareas`
- `Ir a Sentir`
- `Gestionar Premium`

---

## 5) Checklist antes de merge

- [ ] ¿El mensaje empieza con `No se pudo...`?
- [ ] ¿Incluye acción siguiente (`Inténtalo de nuevo` o CTA equivalente)?
- [ ] ¿Evita términos técnicos internos?
- [ ] ¿Tiene longitud breve y tono humano?
- [ ] ¿Usa uno de los CTAs aprobados?

---

## 6) Alcance recomendado

Aplicar este estándar en:

- `app/(tabs)/index.tsx`
- `app/(tabs)/vaciar.tsx`
- `app/(tabs)/sentir.tsx`
- `app/(tabs)/semana.tsx`
- `app/(tabs)/tips.tsx`
- `components/PaywallScreen.tsx`

---

## 7) Relación con guía principal

Esta checklist complementa la guía de voz y microcopy:

- `development_guidelines/delivered/2026-05-05_koraa_voice_and_microcopy_guide.md`
