#!/usr/bin/env node
/**
 * QR para Expo Go. Preferir URL HTTPS de carga (iOS).
 * Uso: npm run dev:qr   (con dev:cf corriendo)
 */
import { createRequire } from 'node:module';
import {
  buildExpoGoUrlFromProxy,
  buildExpoLoadingUrl,
  readDevTunnelState,
  isMetroRunning,
  isTunnelReachable,
  checkTunnelDns,
  getTunnelHostname,
} from './expo-go-url.mjs';

const require = createRequire(import.meta.url);
const qrcode = require('qrcode-terminal');

async function main() {
  const state = readDevTunnelState();
  let loadingUrl = process.argv[2]?.trim();
  let expUrl = process.argv[3]?.trim();
  let proxyUrl = state?.proxyUrl;

  if (loadingUrl?.startsWith('exp://')) {
    expUrl = loadingUrl;
    loadingUrl = undefined;
  }

  if (!loadingUrl && state?.loadingUrl) loadingUrl = state.loadingUrl;
  if (!expUrl && state?.expUrl) expUrl = state.expUrl;
  if (!loadingUrl && proxyUrl) loadingUrl = buildExpoLoadingUrl(proxyUrl);
  if (!expUrl && proxyUrl) expUrl = buildExpoGoUrlFromProxy(proxyUrl);

  if (!loadingUrl && !expUrl) {
    console.error('\n❌ No hay sesión de túnel. Corre primero: npm run dev:cf\n');
    process.exit(1);
  }

  const metroOk = await isMetroRunning();
  if (!metroOk) {
    console.error('\n❌ Metro no está en el puerto 8081.');
    console.error('   Corre: npm run dev:cf   (y deja esa terminal abierta)\n');
    process.exit(1);
  }

  if (proxyUrl) {
    const dns = await checkTunnelDns(getTunnelHostname(proxyUrl));
    if (dns.publicOk && !dns.localOk) {
      console.error('\n⚠️  Tu red no resuelve *.trycloudflare.com (el iPhone verá "hostname not found").');
      console.error('   iPhone: Ajustes → Wi‑Fi → (i) → DNS manual → 1.1.1.1 y 8.8.8.8');
      console.error('   O: hotspot del iPhone + npm run dev:lan en la Mac\n');
    }
    const tunnelOk = await isTunnelReachable(proxyUrl);
    if (!tunnelOk) {
      console.error('\n❌ El túnel ya no responde (URL caducada).');
      console.error('   Ctrl+C en dev:cf → vuelve a ejecutar: npm run dev:cf');
      console.error('   Luego: npm run dev:qr\n');
      process.exit(1);
    }
  }

  console.log('\n📱 iPhone — escanea ESTE QR (HTTPS, más fiable):\n');
  qrcode.generate(loadingUrl, { small: true });
  console.log(`\n  ${loadingUrl}`);
  console.log('\n  Desde Expo Go → Scan, o Cámara de iOS → abre en Expo Go.');
  console.log('\n  Si no abre, pega en Expo Go → Introducir URL:');
  console.log(`  ${expUrl}`);
  console.log('\n  iOS: Ajustes → Expo Go → Red local → ON\n');
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
