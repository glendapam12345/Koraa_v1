#!/usr/bin/env node
/**
 * Imprime la URL exp:// para abrir Koraa en Expo Go (misma Wi‑Fi que la Mac).
 * Uso: node scripts/print-expo-lan-url.mjs [puerto]
 */
import os from 'os';

const port = process.argv[2] || process.env.REACT_NATIVE_PACKAGER_PORT || '8081';

function pickLanIpv4() {
  const nets = os.networkInterfaces();
  const candidates = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] ?? []) {
      if (net.family !== 'IPv4' || net.internal) continue;
      candidates.push({ name, address: net.address });
    }
  }
  const preferred = candidates.find((c) => c.name === 'en0') ?? candidates[0];
  return preferred?.address ?? null;
}

const ip = pickLanIpv4();
if (!ip) {
  console.log('\n⚠️  No se detectó IP de red local. Conéctate a Wi‑Fi y vuelve a ejecutar.\n');
  process.exit(0);
}

const url = `exp://${ip}:${port}`;
const isLikelyIsolatedLan = ip.startsWith('172.20.') || ip.startsWith('10.') && !ip.startsWith('192.168.');

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  Koraa en Expo Go (misma Wi‑Fi)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`\n  ${url}\n`);
console.log('  1. Mac y celular en la MISMA red Wi‑Fi');
console.log('  2. Corre: npm run dev  (o npm run dev:lan)');
console.log('  3. En Expo Go → "Enter URL manually" / URL manual');
console.log(`  4. Pega: ${url}`);
console.log('  5. iOS: Ajustes → Expo Go → Red local → activado\n');
console.log('  Si --tunnel falla con error "reading body", usa esta URL.');
if (isLikelyIsolatedLan) {
  console.log('\n  ⚠️  Red 172.20.x (oficina/universidad): suele bloquear celular↔Mac.');
  console.log('      Si Expo Go dice "timed out", usa HOTSPOT (abajo) o ngrok propio.\n');
}
console.log('  HOTSPOT (recomendado si hay timeout):');
console.log('    iPhone → Ajustes → Compartir internet → ON');
console.log('    Mac → Wi‑Fi → red del iPhone → npm run dev:lan → URL nueva\n');
console.log('  Guía: development_guidelines/learnings/expo_go_device_connection.md\n');
