#!/usr/bin/env node
/**
 * Pre-flight: metro.config.js debe extender expo/metro-config (expo-doctor).
 */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const root = process.cwd();
const metroPath = join(root, 'metro.config.js');

if (!existsSync(metroPath)) {
  console.error('❌ Falta metro.config.js en la raíz del proyecto.');
  process.exit(1);
}

const src = readFileSync(metroPath, 'utf8');

let ok = true;

if (!src.includes('expo/metro-config')) {
  console.error('❌ metro.config.js debe importar desde "expo/metro-config".');
  ok = false;
}

if (!src.includes('getDefaultConfig')) {
  console.error('❌ metro.config.js debe usar getDefaultConfig(__dirname).');
  ok = false;
}

if (!src.includes('koraav2')) {
  console.warn('⚠️ metro.config.js: considera blockList para koraav2/ (carpeta legacy).');
}

if (!ok) {
  process.exit(1);
}

console.log('✅ metro.config.js extiende expo/metro-config correctamente.');
