# Tests

Este directorio contiene los tests unitarios de la aplicación Kora.

## ⚠️ Problema Conocido

Actualmente hay un problema con `jest-expo` que causa el error:
```
TypeError: Object.defineProperty called on non-object
```

Este es un problema conocido con la configuración de `jest-expo` y la versión de Expo. Los tests están correctamente escritos, pero necesitan una configuración alternativa para ejecutarse.

## Configuración

El entorno de testing está configurado con:
- **Jest**: Framework de testing
- **React Native Testing Library**: Para testing de componentes React Native
- **jest-expo**: Preset de Jest para Expo (actualmente con problemas)

## Instalación

Las dependencias ya están instaladas:
- `@testing-library/jest-native`
- `@testing-library/react-native`
- `@types/jest`
- `jest`
- `jest-expo`
- `react-test-renderer`

## Ejecutar Tests (Solución Temporal)

### Opción 1: Usar ts-jest para tests unitarios

Para tests unitarios simples (sin componentes React Native):

```bash
# Instalar ts-jest
npm install --save-dev ts-jest

# Ejecutar solo tests unitarios
npx jest --config jest.config.simple.js __tests__/lib/
```

### Opción 2: Ejecutar tests individuales

```bash
# Test de detección de categorías
npx jest __tests__/lib/categoryDetection.test.ts --no-coverage

# Test de logger
npx jest __tests__/lib/logger.test.ts --no-coverage
```

## Estructura

```
__tests__/
├── components/          # Tests de componentes
│   └── EmotionCard.test.tsx
├── hooks/              # Tests de hooks personalizados
│   └── useCheckIn.test.ts
└── lib/                # Tests de utilidades
    ├── categoryDetection.test.ts
    ├── logger.test.ts
    └── smartPrioritization.test.ts
```

## Mocks

Los mocks están configurados en `jest.setup.js`:
- AsyncStorage
- expo-constants
- expo-router
- expo-haptics
- react-native-reanimated
- Supabase client

## Cobertura

Los tests cubren:
- ✅ Detección automática de categorías
- ✅ Sistema de logging
- ✅ Hook de check-in (`useCheckIn`)
- ✅ Algoritmo de priorización inteligente
- ✅ Componente `EmotionCard`

## Próximos Tests

- [ ] Tests para `useTasks` hook
- [ ] Tests para `useTaskActions` hook
- [ ] Tests para `useProgress` hook
- [ ] Tests para componentes de tareas (`TaskCard`, `TaskList`)
- [ ] Tests para componentes de mood (`MoodCard`)
- [ ] Tests para `offlineStorage` utilities
- [ ] Tests para `personalizedRecommendations`

## Solución del Problema

Ver `TROUBLESHOOTING.md` para más detalles sobre el problema y soluciones alternativas.
