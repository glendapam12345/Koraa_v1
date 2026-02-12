# Troubleshooting de Tests

## Problema: "Object.defineProperty called on non-object"

Este error ocurre cuando `jest-expo` intenta configurar propiedades en objetos que no están disponibles en el entorno de testing.

### Solución Temporal

Para ejecutar tests unitarios simples (sin componentes React Native), puedes usar una configuración alternativa:

1. **Renombrar `jest.config.js` a `jest.config.expo.js`**
2. **Crear un `jest.config.simple.js` para tests unitarios:**

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: ['**/__tests__/lib/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
};
```

3. **Ejecutar tests unitarios con:**
```bash
npx jest --config jest.config.simple.js
```

### Solución Permanente

El problema parece estar relacionado con la versión de `jest-expo` (52.0.6) y la configuración de Expo. Opciones:

1. **Actualizar jest-expo a la última versión:**
```bash
npm install --save-dev jest-expo@latest
```

2. **Usar una versión específica compatible:**
```bash
npm install --save-dev jest-expo@51.0.0
```

3. **Reportar el issue en el repositorio de Expo**

### Tests que Funcionan

Los siguientes tests deberían funcionar una vez resuelto el problema:
- ✅ `categoryDetection.test.ts` - Tests unitarios simples
- ✅ `logger.test.ts` - Tests unitarios simples
- ✅ `smartPrioritization.test.ts` - Tests unitarios simples
- ⚠️ `useCheckIn.test.ts` - Requiere mocks de Supabase
- ⚠️ `EmotionCard.test.tsx` - Requiere React Native Testing Library

### Nota

Los tests están correctamente escritos, el problema es de configuración del entorno de testing con Expo.
