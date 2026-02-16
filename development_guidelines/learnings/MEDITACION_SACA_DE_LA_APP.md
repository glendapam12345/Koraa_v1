# Meditación sacaba de la app al entrar

**Síntoma:** Al tocar "Meditar por la mañana" o "Meditar por la noche" en Hoy, la app se cerraba (crash). Sobre todo en **Expo Go**.

---

## Causas abordadas

1. **Props inválidos en el círculo SVG (MeditationCircle)**  
   El componente usaba `rotation` y `origin` en el `Circle` de `react-native-svg`. Esas props no son estándar en ese elemento y podían provocar fallos en el native layer.  
   **Solución:** Se quitó `rotation` y `origin` y se usó la prop estándar `transform` con formato SVG:  
   `transform={\`rotate(-90 ${CIRCLE_SIZE/2} ${CIRCLE_SIZE/2})\`}`.

2. **Errores no capturados en el modal de meditación**  
   Si Reanimated o el SVG lanzaban en algún dispositivo, el error no se capturaba y la app se cerraba.  
   **Solución:** Se añadió un **error boundary** (`MeditationErrorBoundary`) que envuelve el modal de meditación. Si hay error, se cierra el modal y se muestra un toast; la app no se cierra.

3. **Expo Go: Reanimated + SVG animado inestables**  
   En Expo Go, la combinación de `react-native-reanimated` y `react-native-svg` con `Animated.createAnimatedComponent(Circle)` puede cerrar la app al abrir el modal.  
   **Solución:** Cuando la app corre en **Expo Go** (`Constants.appOwnership === 'expo'`), se usa **MeditationCircleSimple**: misma pantalla y flujo (3 ciclos inhalar/aguantar/exhalar), pero solo con `View`, `Text`, `setInterval` y `expo-linear-gradient`, sin Reanimated ni SVG. En builds nativos o web se sigue usando el modal con animación completa.

---

## Si la meditación sigue fallando

- **Tabla `meditations` en Supabase:** Si no existe, la carga y el guardado de meditaciones pueden fallar (con toast), pero no deberían cerrar la app. Para tener la funcionalidad completa, ejecuta en el SQL Editor la migración:  
  `supabase/migrations/20260211215310_add_meditations_table.sql`.

- **Probar en otro dispositivo o en web:** A veces el fallo es específico de una versión de React Native / Expo o del driver nativo. Probar en web (`npm run dev` → `w`) ayuda a ver si el problema es solo en native.

---

**Última actualización:** febrero 2026
