/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/__tests__/hooks/'],
  moduleNameMapper: {
    '^@/assets/.*\\.(png|jpg|jpeg|gif|webp|svg)$': '<rootDir>/__tests__/mocks/fileMock.js',
    '\\.(png|jpg|jpeg|gif|webp|svg)$': '<rootDir>/__tests__/mocks/fileMock.js',
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          esModuleInterop: true,
        },
      },
    ],
  },
  clearMocks: true,
};
