# Guía de voz y microcopy - Koraa

**Fecha:** 2026-05-05  
**Estado:** Entregado  
**Objetivo:** Mantener una voz consistente, clara y humana en toda la app (UI, errores, toasts, alerts, CTA).

---

## 1) Voz de marca de Koraa

- **Cercana y calmada:** habla como una guía, no como un sistema frío.
- **Directa y accionable:** explica qué pasó y qué hacer después.
- **Breve:** frases cortas y fáciles de escanear.
- **Sin presión:** en Premium y upsell usar tono opcional, no agresivo.

---

## 2) Reglas rápidas (usar siempre)

1. **Un CTA = un verbo claro**
 - Preferir: `Guardar tarea`, `Ver Premium`, `Seguir con versión gratis`, `Ir a Sentir`.
 - Evitar verbos ambiguos fuera de contexto: `Ver más`, `Soltar`, `Detalles`.

2. **Mensajes de error con estructura fija**
 - Formato recomendado: `Qué falló` + `siguiente paso`.
 - Ejemplo: `No se pudo guardar la tarea. Inténtalo de nuevo.`

3. **Mensajes de éxito concretos**
 - Confirmar resultado real, sin adornos innecesarios.
 - Ejemplo: `Tarea guardada correctamente.`

4. **Tuteo consistente**
 - Usar `tu`, `te`, `tú` en todo el producto.
 - Evitar mezclar con `usted`.

5. **No tecnicismos en UI principal**
 - Si hay términos técnicos, moverlos a texto secundario o ayuda.
 - Ejemplo: preferir `tienda no disponible` sobre `offering no cargado`.

6. **Premium con enfoque de valor**
 - Mostrar beneficio concreto: `Semana completa (7 días)`, `historial`, `filtros`.
 - Evitar copy de presión: `última oportunidad`, `no te lo pierdas`.

7. **Acción siguiente siempre visible**
 - Después de un estado vacío o error, incluir una salida clara.
 - Ejemplo: `Ir a Tareas`, `Reintentar`, `Ir a Sentir`.

8. **Longitud recomendada**
 - CTA: 2-4 palabras.
 - Toast: 1 frase corta.
 - Alert: título breve + 1 frase de contexto + acción.

---

## 3) Diccionario recomendado (preferidos)

### CTAs
- `Guardar tarea`
- `Ver Premium`
- `Seguir con versión gratis`
- `Elegir este plan`
- `Restaurar compras`
- `Ir a Sentir`
- `Ir a Tareas`
- `Ver detalles`
- `Ocultar detalles`

### Errores
- `No se pudo guardar...`
- `No se completó...`
- `Inténtalo de nuevo.`
- `Revisa tu conexión.`

### Éxitos
- `Guardado correctamente.`
- `Compras restauradas.`
- `Cambios actualizados.`

---

## 4) Lista blanca de CTAs (estándar)

Usar estos CTAs por defecto. Si aparece uno nuevo, validar que siga la regla de 2-4 palabras y verbo claro.

1. `Continuar`
2. `Comenzar`
3. `Guardar`
4. `Guardar tarea`
5. `Ver prioridades`
6. `Ver Premium`
7. `Elegir este plan`
8. `Seguir con versión gratis`
9. `Restaurar compras`
10. `Ir a Sentir`
11. `Ir a Tareas`
12. `Iniciar sesión`

### CTAs contextuales permitidos
- `Crear cuenta` (registro)
- `Enviar código` (OTP / recuperación)
- `Verificar` (OTP / seguridad)
- `Entendido` (tooltips / confirmaciones)
- `Reintentar` (errores de carga)
- `Mostrar todo ahora` (salida explícita de modo resumido)
- `Vacía tu mente` (CTA de entrada principal en pestaña Tareas)

### CTAs a evitar (salvo contexto específico)
- `Ver más`
- `Detalles`
- `Ahora no`
- `Probar Premium`
- `Soltar`

---

## 5) Ejemplos antes/después

- **Antes:** `Probar Premium`  
  **Después:** `Elegir este plan`

- **Antes:** `Ver planes premium`  
  **Después:** `Ver Premium`

- **Antes:** `Ahora no`  
  **Después:** `Seguir con versión gratis`

- **Antes:** `Compra no completada`  
  **Después:** `No se completó la compra`

- **Antes:** `Soltar` (sin contexto)  
  **Después:** `Guardar tarea`

- **Antes:** `Ver más` / `Detalles`  
  **Después:** `Ver detalles` / `Ocultar detalles`

---

## 6) Plantillas reutilizables

### Error de guardado
`No se pudo guardar <objeto>. Inténtalo de nuevo.`

### Error de conexión
`No hay conexión. Tu cambio se guardará cuando vuelvas a tener internet.`

### Éxito simple
`<Objeto> guardado correctamente.`

### Empty state con acción
`Aún no hay <objeto>.`
`<Breve contexto>.`
`[CTA principal]`

---

## 7) Checklist antes de merge

- [ ] ¿El CTA usa un verbo claro y específico?
- [ ] ¿El mensaje cabe en una lectura rápida?
- [ ] ¿Hay siguiente paso explícito?
- [ ] ¿El tono es cercano, breve y sin tecnicismos?
- [ ] ¿Se mantiene tuteo consistente?
- [ ] ¿Premium se comunica como opcional y basado en valor?

---

## 8) Alcance sugerido

Aplicar esta guía en:
- Pantallas tabs (`Hoy`, `Tareas`, `Sentir`, `Semana`, `Consejos`, `Yo`)
- Auth/onboarding
- Paywall/Premium
- Tooltips, toasts, alerts, modales y FAQs

---

## 9) Nota de mantenimiento

Si se introduce un nuevo patrón de copy, actualizar esta guía en lugar de crear variantes aisladas para mantener consistencia de experiencia cliente.
