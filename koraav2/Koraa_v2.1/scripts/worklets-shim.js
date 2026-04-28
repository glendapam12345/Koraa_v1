const fs = require('fs');
const path = require('path');

const dir = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-worklets',
  'src',
  'initializers'
);
const file = path.join(dir, 'initializers.native.ts');
const content = `'use strict';
// Shim for Expo Go: worklets 0.5.1 has initializers at ../initializers.
// Re-export so Metro finds this when resolving .native.ts
export * from '../initializers';
`;

try {
  if (!fs.existsSync(path.join(__dirname, '..', 'node_modules', 'react-native-worklets'))) {
    process.exit(0);
  }
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, content);
} catch (err) {
  console.warn('worklets-shim: could not create shim (non-fatal):', err.message);
}
