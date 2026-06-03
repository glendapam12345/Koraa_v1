#!/usr/bin/env node
/**
 * Pre-flight: expo-calendar en package.json, plugin en app.config.js, build iOS >= 27.
 */
import { readFileSync } from 'fs';
import { join } from 'path';

const root = process.cwd();
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const appConfigSrc = readFileSync(join(root, 'app.config.js'), 'utf8');

let ok = true;

if (!pkg.dependencies?.['expo-calendar']) {
  console.error('❌ Falta dependencia expo-calendar en package.json');
  ok = false;
} else {
  console.log(`✅ expo-calendar: ${pkg.dependencies['expo-calendar']}`);
}

if (!appConfigSrc.includes("'expo-calendar'") && !appConfigSrc.includes('"expo-calendar"')) {
  console.error('❌ Falta plugin expo-calendar en app.config.js');
  ok = false;
} else {
  console.log('✅ Plugin expo-calendar en app.config.js');
}

const buildMatch = appConfigSrc.match(/buildNumber:\s*['"]?(\d+)['"]?/);
const buildNum = buildMatch ? parseInt(buildMatch[1], 10) : 0;
if (buildNum < 27) {
  console.error(
    `❌ ios.buildNumber es ${buildNum}; sube a 27+ antes de EAS build (calendario nativo).`,
  );
  ok = false;
} else {
  console.log(`✅ ios.buildNumber: ${buildNum}`);
}

if (!ok) {
  process.exit(1);
}

console.log('\n✅ Calendario nativo listo para build EAS.');
console.log('   Siguiente: eas build --platform ios --profile production');
