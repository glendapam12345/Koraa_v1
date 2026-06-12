#!/usr/bin/env node
/**
 * Metro en 8081 + cloudflared + EXPO_PACKAGER_PROXY_URL (Expo Go en celular).
 * Uso: npm run dev:cf
 */
import { spawn, execSync } from 'node:child_process';
import http from 'node:http';
import localtunnel from 'localtunnel';
import { createRequire } from 'node:module';
import {
  buildExpoGoUrlFromProxy,
  buildExpoLoadingUrl,
  getTunnelHostname,
  writeDevTunnelState,
  isTunnelReachable,
  checkTunnelDns,
  parseCloudflaredTunnelUrl,
} from './expo-go-url.mjs';

const require = createRequire(import.meta.url);
const qrcode = require('qrcode-terminal');

const PORT = 8081;
const CLOUDFLARED = process.env.CLOUDFLARED_PATH || 'cloudflared';
const EXPO_CLI = new URL('../node_modules/expo/bin/cli', import.meta.url).pathname;

function assertSupportedNode() {
  const major = Number(process.versions.node.split('.')[0]);
  if (major >= 23) {
    console.error('\n❌ Node', process.versions.node, 'no es compatible con Expo SDK 54.');
    console.error('   Usa Node 20 LTS: nvm use 20\n');
    process.exit(1);
  }
}

function killPort(port) {
  try {
    const pids = execSync(`lsof -ti :${port}`, { encoding: 'utf8' }).trim();
    if (!pids) return;
    for (const pid of pids.split(/\s+/)) {
      if (pid) process.kill(Number(pid), 'SIGKILL');
    }
  } catch {
    /* puerto libre */
  }
}

const METRO_START_TIMEOUT_MS = 600_000;

function waitForMetro(isExpoDead, maxMs = METRO_START_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    let lastProgressLog = start;
    const tick = () => {
      if (isExpoDead()) {
        reject(new Error('Expo terminó antes de que Metro respondiera'));
        return;
      }
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
      if (isExpoDead()) {
        reject(new Error('Expo terminó antes de que Metro respondiera'));
        return;
      }
      const elapsed = Date.now() - start;
      if (elapsed - lastProgressLog >= 30_000) {
        lastProgressLog = elapsed;
        const mins = Math.floor(elapsed / 60_000);
        const secs = Math.floor((elapsed % 60_000) / 1000);
        console.log(`  ⏳ Esperando Metro… ${mins}m ${secs}s (la 1.ª vez puede tardar 3–5 min)`);
      }
      if (elapsed > maxMs) {
        reject(
          new Error(
            `Metro no arrancó en ${Math.round(maxMs / 60_000)} min. Prueba: npm run dev:fresh y Node 20 LTS (ver .nvmrc).`,
          ),
        );
        return;
      }
      setTimeout(tick, 600);
    };
    tick();
  });
}

function startCloudflared() {
  return new Promise((resolve, reject) => {
    console.log('  (puede tardar 15–40 s; si falla, probamos otro túnel…)\n');
    const proc = spawn(
      CLOUDFLARED,
      ['tunnel', '--url', `http://127.0.0.1:${PORT}`],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    );

    let buf = '';
    const onData = (c) => {
      const chunk = c.toString();
      buf += chunk;
      process.stderr.write(chunk);
      const url = parseCloudflaredTunnelUrl(buf);
      if (url) {
        clearTimeout(timer);
        resolve({ url, proc });
      }
    };

    proc.stdout?.on('data', onData);
    proc.stderr?.on('data', onData);
    proc.on('error', (e) => {
      clearTimeout(timer);
      reject(e.code === 'ENOENT' ? new Error('Instala cloudflared: brew install cloudflared') : e);
    });

    const timer = setTimeout(() => {
      proc.kill('SIGTERM');
      reject(new Error('cloudflared timeout'));
    }, 120_000);
  });
}

async function openLocaltunnel() {
  const tunnel = await Promise.race([
    localtunnel({ port: PORT }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('localtunnel timeout')), 90_000),
    ),
  ]);
  return { url: tunnel.url, proc: { kill: () => tunnel.close() } };
}

async function openPublicTunnel() {
  try {
    return await startCloudflared();
  } catch (err) {
    console.log(`\ncloudflared: ${err instanceof Error ? err.message : err}`);
  }

  console.log('\nIntentando localtunnel…');
  return openLocaltunnel();
}

function startExpo(proxyUrl) {
  return spawn(
    process.execPath,
    [EXPO_CLI, 'start', '--port', String(PORT), '--lan'],
    {
      env: {
        ...process.env,
        EXPO_PACKAGER_PROXY_URL: proxyUrl,
        REACT_NATIVE_PACKAGER_PORT: String(PORT),
        EXPO_NO_TELEMETRY: '1',
      },
      // Pipe: evita el QR de Expo (exp:// sin puerto) que rompe en iOS.
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    },
  );
}

function printDnsFix() {
  console.log('\n  🔧 ARREGLO DNS (causa habitual del error en iPhone):');
  console.log('     Ajustes → Wi‑Fi → (i) tu red → Configurar DNS → Manual');
  console.log('     Añade: 1.1.1.1 y 8.8.8.8 → Guardar → reintenta el QR');
  console.log('\n  O más fiable: hotspot del iPhone + en la Mac: npm run dev:lan\n');
}

function printConnectionHelp({ proxyUrl, expUrl, loadingUrl, tunnelOk, dns }) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  📱 CONECTAR EXPO GO');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (dns && dns.publicOk && !dns.localOk) {
    console.log('\n  ⚠️  Tu Mac no resuelve el host del túnel (el iPhone en la misma Wi‑Fi tampoco).');
    printDnsFix();
  }
  if (!tunnelOk) {
    console.log('\n  ⚠️  El túnel aún no responde. Espera 10–20 s y ejecuta: npm run dev:qr');
    console.log('  Si sigue fallando: hotspot del iPhone + npm run dev:lan\n');
  }
  console.log('\n  Escanea SOLO este QR (HTTPS) desde Expo Go → Scan:\n');
  qrcode.generate(loadingUrl, { small: true });
  console.log(`\n  ${loadingUrl}`);
  console.log('\n  No uses el QR exp:// de arriba si Expo lo mostró — suele fallar.');
  console.log('\n  URL manual en Expo Go (pegar):');
  console.log(`  ${loadingUrl}`);
  console.log('\n  • Deja ESTA terminal abierta (si cierras, el QR deja de funcionar).');
  console.log('  • iOS: Ajustes → Expo Go → Red local → ON');
  console.log('  • Otra terminal: npm run dev:qr');
  console.log(`  • Túnel: ${proxyUrl}\n`);
}

async function main() {
  assertSupportedNode();
  console.log('Liberando puerto 8081…');
  killPort(PORT);
  killPort(8082);

  console.log('Iniciando túnel…');
  let tunnel;
  try {
    tunnel = await openPublicTunnel();
  } catch (e) {
    console.error('❌', e instanceof Error ? e.message : e);
    process.exit(1);
  }

  const proxyUrl = tunnel.url;
  const expUrl = buildExpoGoUrlFromProxy(proxyUrl);
  const loadingUrl = buildExpoLoadingUrl(proxyUrl, 'ios');
  writeDevTunnelState({ proxyUrl, expUrl, loadingUrl });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Túnel:', proxyUrl);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('Iniciando Metro en 8081…');
  console.log('  (la 1.ª vez puede tardar varios minutos; no cierres esta terminal)\n');

  const expo = startExpo(proxyUrl);
  let expoExited = false;

  expo.stdout?.on('data', (chunk) => process.stdout.write(chunk));
  expo.stderr?.on('data', (chunk) => process.stderr.write(chunk));
  expo.on('exit', (code) => {
    expoExited = true;
    if (code && code !== 0) {
      console.error(`\nExpo terminó con código ${code}`);
    }
  });

  const cleanup = () => {
    try {
      tunnel.proc.kill('SIGTERM');
    } catch {
      /* ignore */
    }
    try {
      expo.kill('SIGINT');
    } catch {
      /* ignore */
    }
  };

  process.on('SIGINT', () => {
    cleanup();
    process.exit(0);
  });

  try {
    await waitForMetro(() => expoExited);
    if (expoExited) {
      throw new Error('Expo terminó antes de que Metro respondiera');
    }
    console.log('\n✅ Metro OK en localhost:8081.');
    const hostname = getTunnelHostname(proxyUrl);
    const dns = await checkTunnelDns(hostname);
    const tunnelOk = await isTunnelReachable(proxyUrl, 45_000);
    if (tunnelOk) {
      console.log('✅ Túnel verificado.');
    } else {
      console.log('\n⚠️  El túnel tarda en estar listo (o la red lo bloquea).');
      console.log('   Prueba npm run dev:qr en 15 s, o hotspot + npm run dev:lan\n');
    }
    if (dns.publicOk && !dns.localOk) {
      console.log('⚠️  DNS local: no resuelve el túnel (error típico en iPhone: hostname not found).');
    }
    printConnectionHelp({ proxyUrl, expUrl, loadingUrl, tunnelOk, dns });
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    cleanup();
    process.exit(1);
  }
}

main();
