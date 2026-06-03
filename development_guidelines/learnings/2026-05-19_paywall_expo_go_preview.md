# Paywall en Expo Go (auditoría paso 4)

**Fecha:** 2026-05-19  
**Problema:** En Expo Go, RevenueCat no ofrece compras reales; precios fallback y botones «Comprar» parecían rotos.

## Solución

| Pieza | Rol |
|-------|-----|
| `lib/subscriptionEnvironment.ts` | `isExpoGoClient()`, `canProcessInAppPurchases()` |
| `PaywallScreen` | Banner visible, modo preview, CTAs deshabilitados con mensaje claro |
| i18n `paywallExtra.expoGo*` | ES/EN |

## Comportamiento

- **Expo Go:** banner «Vista previa», precios orientativos, botón «Disponible en TestFlight / App Store», alerta si tocan comprar/restaurar.
- **TestFlight / App Store:** flujo normal de RevenueCat sin cambios.

## Probar

1. `npm run dev` + Expo Go → Yo → Suscripción o `/paywall`.
2. Ver banner azul y CTAs grises (no gradiente de compra).
3. Tocar CTA → alerta «Compra no disponible en Expo Go».
4. TestFlight build 27+ → compras y restaurar deben funcionar como antes.
