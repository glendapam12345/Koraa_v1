// Configuración alternativa de Jest para tests unitarios simples
// Usa ts-jest en lugar de jest-expo para evitar problemas de configuración
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom', // Cambiado a jsdom para soportar AsyncStorage
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: ['**/__tests__/lib/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        types: ['jest', 'node'],
      },
    }],
  },
  collectCoverageFrom: [
    'lib/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.simple.js'],
};
