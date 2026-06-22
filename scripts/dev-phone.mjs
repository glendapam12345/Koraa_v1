#!/usr/bin/env node
/**
 * Túnel público para Expo Go cuando LAN (172.20.x) hace timeout.
 * Uso:
 *   npm run dev:phone          → túnel + Metro con proxy (Fast Refresh en Expo Go)
 *   npm run dev:phone:tunnel   → solo túnel (Metro ya en 8081 con EXPO_PACKAGER_PROXY_URL)
 */
import { spawn, execSync } from 'node:child_process';
import http from 'node:http';
import { createRequire } from 'node:module';
import localtunnel from 'localtunnel';
import {
  buildExpoGoUrlFromProxy,
  buildExpoLoadingUrl,
  writeDevTunnelState,
  parseCloudflaredTunnelUrl,
  getTunnelHostname,
  isTunnelReachable,
  waitForTunnelReachable,
  warmUpMetroBundle,
  checkTunnelDns,
} from './expo-go-url.mjs';

const require = createRequire(import.meta.url);
const qrcode = require('qrcode-terminal');

const PORT = Number(process.env.REACT_NATIVE_PACKAGER_PORT || 8081);
const CLOUDFLARED = process.env.CLOUDFLARED_PATH || 'cloudflared';
const EXPO_CLI = new URL('../node_modules/expo/bin/cli', import.meta.url).pathname;
const tunnelOnly = process.argv.includes('--tunnel-only');
const skipWarmup = process.argv.includes('--skip-warmup');

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
    // Solo el proceso que escucha (Metro). No matar clientes como cloudflared → localhost:8081.
    const pids = execSync(`lsof -tiTCP:${port} -sTCP:LISTEN`, { encoding: 'utf8' }).trim();
    if (!pids) return;
    for (const pid of pids.split(/\s+/)) {
      if (pid) process.kill(Number(pid), 'SIGKILL');
    }
  } catch {
    /* puerto libre */
  }
}

function waitForMetro(isExpoDead = () => false, maxMs = 120_000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tryOnce = () => {
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
      if (Date.now() - start > maxMs) {
        reject(new Error(`Metro no respondió en el puerto ${PORT}.`));
        return;
      }
      setTimeout(tryOnce, 800);
    };
    tryOnce();
  });
}

function printDnsFix() {
  console.log('\n  🔧 Si el iPhone no conecta (hostname not found):');
  console.log('     Ajustes → Wi‑Fi → (i) → Configurar DNS → Manual → 1.1.1.1 y 8.8.8.8');
}

function printExpoGoInstructions({ proxyUrl, expUrl, loadingUrl, tunnelOk, bundleOk, dns }) {
  writeDevTunnelState({ proxyUrl, expUrl, loadingUrl });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(bundleOk && tunnelOk ? '  📱 LISTO — escanea en Expo Go' : '  📱 Expo Go');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (dns && dns.publicOk && !dns.localOk) {
    console.log('  ⚠️  Tu Mac no resuelve el host del túnel (el iPhone puede fallar igual).');
    printDnsFix();
    console.log('');
  }
  if (tunnelOk === false) {
    console.log('  ⚠️  El túnel aún no responde. Espera 20–30 s y escanea, o reinicia npm run dev:phone.\n');
  }
  if (bundleOk === false) {
    console.log(
      '  ⚠️  El bundle no terminó de compilar. No escanees aún; espera o usa Reload JS en Expo Go.\n',
    );
  }

  qrcode.generate(loadingUrl, { small: true });
  console.log(`\n  ${loadingUrl}`);
  console.log(`  Alternativa exp: ${expUrl}`);
  console.log('  Escanea con Expo Go (pestaña Scan) o Cámara iOS.');
  console.log('  iOS: Ajustes → Expo Go → Red local → ON');
  if (!bundleOk || !tunnelOk) {
    console.log('\n  Si ves pantalla roja: aguarda en esta terminal y pulsa Reload JS en Expo Go.');
  } else {
    console.log('\n  Los cambios en código se reflejan al guardar (Fast Refresh).');
  }
  console.log('  Deja esta terminal abierta mientras desarrollas.');
  console.log('\n  No uses exp://172.20.x.x — esa red te bloquea.\n');
}

function startCloudflaredTunnel() {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      CLOUDFLARED,
      ['tunnel', '--url', `http://127.0.0.1:${PORT}`],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    );

    let buf = '';
    const onData = (chunk) => {
      buf += chunk.toString();
      const url = parseCloudflaredTunnelUrl(buf);
      if (url) {
        clearTimeout(timer);
        resolve({ url, close: () => proc.kill('SIGTERM') });
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

function startExpo(proxyUrl) {
  const env = {
    ...process.env,
    REACT_NATIVE_PACKAGER_PORT: String(PORT),
    EXPO_NO_TELEMETRY: '1',
  };
  if (proxyUrl) {
    env.EXPO_PACKAGER_PROXY_URL = proxyUrl;
  }

  return spawn(process.execPath, [EXPO_CLI, 'start', '--port', String(PORT), '--lan'], {
    env,
    // Pipe: evita el QR exp:// LAN que rompe en iOS; usamos el HTTPS del túnel.
    stdio: proxyUrl ? ['ignore', 'pipe', 'pipe'] : 'inherit',
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
  Reinicia Metro con proxy para ver cambios en vivo:
    EXPO_PACKAGER_PROXY_URL=https://….trycloudflare.com npm run dev:clear

  O en ESTA terminal pulsa  i  → simulador iOS (Mac).
`);
}

async function main() {
  assertSupportedNode();

  let expo = null;
  let tunnel = null;
  let expoExited = false;

  const closeTunnel = () => {
    try {
      tunnel?.close?.();
    } catch {
      /* ignore */
    }
  };

  const cleanup = () => {
    closeTunnel();
    try {
      expo?.kill('SIGINT');
    } catch {
      /* ignore */
    }
  };

  process.on('SIGINT', () => {
    cleanup();
    process.exit(0);
  });

  if (!tunnelOnly) {
    console.log(`Liberando puerto ${PORT}…`);
    killPort(PORT);
    killPort(PORT + 1);

    console.log('Iniciando túnel (antes de Metro, para Fast Refresh)…\n');
    try {
      tunnel = await openPublicTunnel();
    } catch (err) {
      console.error('\n❌ No se pudo abrir túnel automático.');
      if (err instanceof Error) console.error('   ', err.message);
      printFallbackHelp();
      process.exit(1);
    }

    const proxyUrl = tunnel.url;
    console.log(`\n  Túnel: ${proxyUrl}\n`);
    console.log('Iniciando Metro (Expo) con EXPO_PACKAGER_PROXY_URL…\n');

    expo = startExpo(proxyUrl);
    expo.stdout?.on('data', (chunk) => process.stdout.write(chunk));
    expo.stderr?.on('data', (chunk) => process.stderr.write(chunk));
    expo.on('exit', (code) => {
      expoExited = true;
      closeTunnel();
      if (code && code !== 0) {
        console.error(`\nExpo terminó con código ${code}`);
      }
    });
  } else {
    console.log(`Buscando Metro en el puerto ${PORT}…\n`);
    console.log(
      '  Nota: Fast Refresh solo funciona si Metro se inició con EXPO_PACKAGER_PROXY_URL.',
    );
    console.log('  Si los cambios no aparecen, usa: npm run dev:phone\n');
  }

  try {
    await waitForMetro(() => expoExited);
    if (expoExited) {
      throw new Error('Expo terminó antes de que Metro respondiera');
    }

    if (!tunnel) {
      tunnel = await openPublicTunnel();
    }

    const proxyUrl = tunnel.url.startsWith('http') ? tunnel.url : `https://${tunnel.url}`;
    const expUrl = buildExpoGoUrlFromProxy(proxyUrl);
    const loadingUrl = buildExpoLoadingUrl(proxyUrl, 'ios');

    console.log('\n✅ Metro OK.');
    const hostname = getTunnelHostname(proxyUrl);

    console.log(
      skipWarmup
        ? '\n⏳ Verificando túnel (bundle sin precompilar; --skip-warmup)…'
        : '\n⏳ Preparando conexión (bundle iOS + túnel; la 1ª vez puede tardar 3–8 min)…',
    );

    const warmupPromise = skipWarmup
      ? Promise.resolve({ ok: true, bytes: 0, skipped: true })
      : warmUpMetroBundle(PORT, {
          maxMs: 600_000,
          onProgress: (seconds) => {
            process.stdout.write(`\r  Compilando bundle iOS… ${seconds}s`);
          },
        });

    const [bundleResult, tunnelOk, dns] = await Promise.all([
      warmupPromise,
      waitForTunnelReachable(proxyUrl, 120_000),
      checkTunnelDns(hostname),
    ]);

    if (!skipWarmup) process.stdout.write('\n');

    const bundleOk = bundleResult.ok;
    if (bundleOk && !bundleResult.skipped) {
      console.log(
        `✅ Bundle listo (${Math.round(bundleResult.bytes / 1024)} KB en ${Math.round(bundleResult.elapsedMs / 1000)}s).`,
      );
    } else if (bundleResult.timedOut) {
      console.log('⚠️  Bundle tardó más de 10 min. Si Expo Go falla, espera y pulsa Reload JS.');
    } else if (!skipWarmup) {
      console.log('⚠️  No se pudo precompilar el bundle. Revisa errores de Metro arriba.');
    }

    if (tunnelOk) {
      console.log('✅ Túnel verificado.');
    } else {
      console.log('⚠️  Túnel sin respuesta. Prueba DNS manual (1.1.1.1) o npm run dev:cf.');
    }

    printExpoGoInstructions({ proxyUrl, expUrl, loadingUrl, tunnelOk, bundleOk, dns });
  } catch (err) {
    console.error('\n❌ No se pudo preparar la conexión con Expo Go.');
    if (err instanceof Error) console.error('   ', err.message);
    if (tunnelOnly && err instanceof Error && err.message.includes('Metro no respondió')) {
      console.error('\n   Metro no está en el puerto 8081.');
      console.error('   Usa un solo comando: npm run dev:phone');
      console.error('   O: npm run dev:cf\n');
    }
    printFallbackHelp();
    if (tunnelOnly) {
      cleanup();
      process.exit(1);
    }
    return;
  }

  if (tunnelOnly) {
    await new Promise(() => {});
  }
}

main();
