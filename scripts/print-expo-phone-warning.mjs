#!/usr/bin/env node
/**
 * Aviso al iniciar dev:clear / dev — evita confusión con Expo Go en celular.
 */
import os from 'os';

function isUsableLanIp(address) {
  if (!address || address.startsWith('127.')) return false;
  // APIPA / link-local — no sirve para Expo Go en Wi‑Fi
  if (address.startsWith('169.254.')) return false;
  return true;
}

function pickLanIpv4() {
  const nets = os.networkInterfaces();
  const candidates = [];

  for (const name of Object.keys(nets)) {
    for (const net of nets[name] ?? []) {
      if (net.family !== 'IPv4' || net.internal) continue;
      if (!isUsableLanIp(net.address)) continue;
      candidates.push({ name, address: net.address });
    }
  }

  const preferred =
    candidates.find((c) => c.name === 'en0' && c.address.startsWith('192.168.')) ??
    candidates.find((c) => c.address.startsWith('192.168.')) ??
    candidates.find((c) => c.name === 'en0') ??
    candidates[0];

  return preferred?.address ?? null;
}

const ip = pickLanIpv4();
const port = process.env.REACT_NATIVE_PACKAGER_PORT || '8081';
const lanUrl = ip ? `exp://${ip}:${port}` : `exp://TU_IP_LOCAL:${port}`;

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  📱 Si desarrollas en CELULAR (Expo Go)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n  Espera a ver "Metro waiting on exp://…" en esta terminal.');
console.log('  Luego en el iPhone:\n');
console.log('  1. Abre **Expo Go** (no solo la Cámara)');
console.log('  2. **Introducir URL** y pega la URL que muestre Metro abajo');
if (ip) console.log(`     (aprox. ${lanUrl})`);
console.log('  3. Misma Wi‑Fi + Ajustes → Expo Go → Red local → ON\n');
console.log('  Si dice "could not connect" o Expo Go no abre nada:');
console.log('     • HOTSPOT del iPhone + npm run dev:clear (más fiable)');
console.log('     • O: npm run dev:phone / npm run dev:cf');
console.log('     • iPhone DNS manual: 1.1.1.1 y 8.8.8.8 si usas túnel\n');
