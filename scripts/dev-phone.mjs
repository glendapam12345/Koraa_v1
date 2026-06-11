#!/usr/bin/env node
/**
 * Túnel público para Expo Go cuando LAN (172.20.x) hace timeout.
 * Uso:
 *   npm run dev:phone          → Metro + túnel (cloudflared o localtunnel)
 *   npm run dev:phone:tunnel   → solo túnel (Metro ya en 8081)
 */
import { spawn } from 'node:child_process';
import http from 'node:http';
import { createRequire } from 'node:module';
import localtunnel from 'localtunnel';
import {
  buildExpoGoUrlFromProxy,
  buildExpoLoadingUrl,
  writeDevTunnelState,
} from './expo-go-url.mjs';

const require = createRequire(import.meta.url);
const qrcode = require('qrcode-terminal');

const PORT = Number(process.env.REACT_NATIVE_PACKAGER_PORT || 8081);
const tunnelOnly = process.argv.includes('--tunnel-only');

function waitForMetro(maxMs = 120_000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tryOnce = () => {
      const req = http.get(`http://127.0.0.1:${PORT}/status`, (res) => {
        res.resume();
        if (res.statusCode === 200) resolve();
        else schedule();
      });
      req.on('error', schedule);
      req.setTimeout(2000, () => {
        req.destroy();
        schedule();
      });
    };
    const schedule = () => {
      if (Date.now() - start > maxMs) {
        reject(new Error(`Metro no respondió en el puerto ${PORT}.`));
        return;
      }
      setTimeout(tryOnce, 800);
    };
    tryOnce();
  });
}

function printExpoGoInstructions(tunnelUrl) {
  const proxyUrl = tunnelUrl.startsWith('http') ? tunnelUrl : `https://${tunnelUrl}`;
  const expUrl = buildExpoGoUrlFromProxy(proxyUrl);
  const loadingUrl = buildExpoLoadingUrl(proxyUrl, 'ios');
  writeDevTunnelState({ proxyUrl, expUrl, loadingUrl });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  📱 Expo Go');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  qrcode.generate(loadingUrl, { small: true });
  console.log(`\n  ${loadingUrl}`);
  console.log(`  Alternativa exp: ${expUrl}`);
  console.log('  Escanea con Expo Go (pestaña Scan) o Cámara iOS.');
  console.log('  iOS: Ajustes → Expo Go → Red local → ON');
  console.log('\n  No uses exp://172.20.x.x — esa red te bloquea.\n');
}

function startCloudflaredTunnel() {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      'cloudflared',
      ['tunnel', '--url', `http://127.0.0.1:${PORT}`],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    );

    let buf = '';
    const onData = (chunk) => {
      buf += chunk.toString();
      const m = buf.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
      if (m) {
        clearTimeout(timer);
        resolve({ url: m[0], close: () => proc.kill('SIGTERM') });
      }
    };

    proc.stdout?.on('data', onData);
    proc.stderr?.on('data', onData);
    proc.on('error', (err) => {
      clearTimeout(timer);
      if (err.code === 'ENOENT') {
        reject(new Error('CLOUDFLARED_NOT_INSTALLED'));
      } else {
        reject(err);
      }
    });

    const timer = setTimeout(() => {
      proc.kill('SIGTERM');
      reject(new Error('cloudflared no respondió a tiempo'));
    }, 90_000);
  });
}

async function openLocaltunnel() {
  const tunnel = await Promise.race([
    localtunnel({ port: PORT }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('localtunnel timeout')), 90_000),
    ),
  ]);
  return { url: tunnel.url, close: () => tunnel.close() };
}

async function openPublicTunnel() {
  try {
    console.log('Intentando túnel con cloudflared…');
    return await startCloudflaredTunnel();
  } catch (err) {
    if (err instanceof Error && err.message === 'CLOUDFLARED_NOT_INSTALLED') {
      console.log('cloudflared no instalado. Instala con: brew install cloudflared\n');
    } else {
      console.log(`cloudflared: ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log('Intentando localtunnel…');
  return openLocaltunnel();
}

function startExpo() {
  return spawn('npx', ['expo', 'start', '--port', String(PORT), '--lan'], {
    env: {
      ...process.env,
      REACT_NATIVE_PACKAGER_PORT: String(PORT),
      EXPO_NO_TELEMETRY: '1',
    },
    stdio: 'inherit',
    shell: false,
  });
}

function printFallbackHelp() {
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Metro sigue corriendo. Túnel manual:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Terminal nueva:
    brew install cloudflared
    cloudflared tunnel --url http://localhost:${PORT}

  Copia la URL https://….trycloudflare.com
  En Expo Go → exp://EL-HOST-SIN-https

  O en ESTA terminal pulsa  i  → simulador iOS (Mac).
`);
}

async function main() {
  let expo = null;
  let tunnel = null;

  const closeTunnel = () => {
    try {
      tunnel?.close?.();
    } catch {
      /* ignore */
    }
  };

  process.on('SIGINT', () => {
    closeTunnel();
    try {
      expo?.kill('SIGINT');
    } catch {
      /* ignore */
    }
    process.exit(0);
  });

  if (!tunnelOnly) {
    console.log('Iniciando Metro (Expo)…\n');
    expo = startExpo();
    expo.on('exit', closeTunnel);
  } else {
    console.log(`Buscando Metro en el puerto ${PORT}…\n`);
  }

  try {
    await waitForMetro();
    tunnel = await openPublicTunnel();
    printExpoGoInstructions(tunnel.url);
  } catch (err) {
    console.error('\n❌ No se pudo abrir túnel automático.');
    if (err instanceof Error) console.error('   ', err.message);
    printFallbackHelp();
    if (tunnelOnly) process.exit(1);
    return;
  }

  if (tunnelOnly) {
    await new Promise(() => {});
  }
}

main();
