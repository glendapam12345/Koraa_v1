# Tests

Este directorio contiene los tests unitarios de la aplicación Kora.

## Configuración

El entorno de testing está configurado con:
- **Jest**: Framework de testing
- **React Native Testing Library**: Para testing de componentes React Native
- **jest-expo**: Preset de Jest para Expo

## Instalación

Para instalar las dependencias de testing, ejecuta:

```bash
npm install --save-dev @testing-library/jest-native @testing-library/react-native @types/jest jest jest-expo react-test-renderer
```

## Ejecutar Tests

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch
npm run test:watch

# Ejecutar tests con cobertura
npm run test:coverage
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
