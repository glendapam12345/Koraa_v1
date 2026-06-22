#!/usr/bin/env node
/**
 * Metro en 8081 + cloudflared + EXPO_PACKAGER_PROXY_URL (Expo Go en celular).
 * Uso: npm run dev:cf
 *
 * Orden: Metro primero (evita ERR de cloudflared) → túnel → reinicio rápido con proxy.
 */
import { spawn, execSync } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import localtunnel from 'localtunnel';
import { createRequire } from 'node:module';
import {
  buildExpoGoUrlFromProxy,
  buildExpoLoadingUrl,
  getTunnelHostname,
  getLanExpoUrl,
  writeDevTunnelState,
  waitForTunnelReachable,
  warmUpMetroBundle,
  checkTunnelDns,
  parseCloudflaredTunnelUrl,
  isMetroRunning,
} from './expo-go-url.mjs';

const require = createRequire(import.meta.url);
const qrcode = require('qrcode-terminal');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8081;
const CLOUDFLARED = process.env.CLOUDFLARED_PATH || 'cloudflared';
const EXPO_CLI = path.join(ROOT, 'node_modules', 'expo', 'bin', 'cli');
const TUNNEL_ONLY = process.argv.includes('--tunnel-only');
const CLEAR_CACHE = process.argv.includes('--clear');

/** 1.ª compilación en Mac lenta: hasta 20 min antes de rendirse. */
const METRO_COLD_TIMEOUT_MS = 1_200_000;
const METRO_WARM_TIMEOUT_MS = 300_000;

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

function waitForMetro(isExpoDead, maxMs, label = 'Metro') {
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
        console.log(`  ⏳ Esperando ${label}… ${mins}m ${secs}s (la 1.ª vez puede tardar 5–15 min)`);
      }
      if (elapsed > maxMs) {
        reject(
          new Error(
            `${label} no respondió en ${Math.round(maxMs / 60_000)} min. Deja esta terminal abierta si aún ves "Starting Metro Bundler", o prueba: npm run dev:fresh`,
          ),
        );
        return;
      }
      setTimeout(tick, 600);
    };
    tick();
  });
}

function startCloudflared({ quiet = false } = {}) {
  return new Promise((resolve, reject) => {
    if (!quiet) {
      console.log('  (túnel cloudflared; 15–40 s…)\n');
    }
    const proc = spawn(
      CLOUDFLARED,
      ['tunnel', '--url', `http://127.0.0.1:${PORT}`],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    );

    let buf = '';
    const onData = (c) => {
      const chunk = c.toString();
      buf += chunk;
      if (!quiet) process.stderr.write(chunk);
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

async function openPublicTunnel(opts) {
  try {
    return await startCloudflared(opts);
  } catch (err) {
    console.log(`\ncloudflared: ${err instanceof Error ? err.message : err}`);
  }
  console.log('\nIntentando localtunnel…');
  return openLocaltunnel();
}

function stopTunnelProc(tunnel) {
  try {
    tunnel?.proc?.kill?.('SIGTERM');
  } catch {
    /* ignore */
  }
}

/** Abre túnel y verifica que responda; si cloudflared falla, prueba localtunnel. */
async function openVerifiedPublicTunnel(opts = {}) {
  let tunnel = null;
  try {
    tunnel = await startCloudflared(opts);
    const ok = await waitForTunnelReachable(tunnel.url, 45_000);
    if (ok) return { tunnel, proxyUrl: tunnel.url, provider: 'cloudflared' };
    console.log('\n⚠️  cloudflared no responde (URL caducada o DNS bloqueado).');
    stopTunnelProc(tunnel);
    tunnel = null;
  } catch (err) {
    console.log(`\ncloudflared: ${err instanceof Error ? err.message : err}`);
  }

  console.log('\nIntentando localtunnel…');
  tunnel = await openLocaltunnel();
  const ok = await waitForTunnelReachable(tunnel.url, 60_000);
  if (ok) return { tunnel, proxyUrl: tunnel.url, provider: 'localtunnel' };

  stopTunnelProc(tunnel);
  throw new Error('TUNNEL_UNREACHABLE');
}

function startExpo({ proxyUrl, clearCache = false } = {}) {
  const args = ['start', '--port', String(PORT), '--lan'];
  if (clearCache) args.push('--clear');

  const env = {
    ...process.env,
    REACT_NATIVE_PACKAGER_PORT: String(PORT),
    EXPO_NO_TELEMETRY: '1',
  };
  if (proxyUrl) {
    env.EXPO_PACKAGER_PROXY_URL = proxyUrl;
  }

  const logLines = [];
  const pushLog = (chunk, isErr) => {
    const text = chunk.toString();
    (isErr ? process.stderr : process.stdout).write(text);
    for (const line of text.split('\n')) {
      const trimmed = line.trimEnd();
      if (trimmed) logLines.push(trimmed);
    }
    if (logLines.length > 120) logLines.splice(0, logLines.length - 120);
  };

  const proc = spawn(process.execPath, [EXPO_CLI, ...args], {
    cwd: ROOT,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
  });
  proc.stdout?.on('data', (chunk) => pushLog(chunk, false));
  proc.stderr?.on('data', (chunk) => pushLog(chunk, true));
  proc.getRecentLogs = () => logLines.join('\n');
  return proc;
}

function printExpoCrashHint(expo, exitCode) {
  const logs = expo?.getRecentLogs?.() ?? '';
  console.error(`\nExpo terminó${exitCode != null ? ` (código ${exitCode})` : ''} antes de que Metro respondiera.`);
  if (logs.trim()) {
    console.error('\n  Últimas líneas de Expo/Metro:\n');
    console.error(logs.split('\n').slice(-25).map((l) => `  ${l}`).join('\n'));
  } else {
    console.error('\n  Expo no imprimió nada. Prueba en otra terminal: npm run dev:clear');
    console.error('  Espera "Metro waiting on…" y luego: npm run dev:cf:tunnel');
  }
}

function stopExpo(expo) {
  if (!expo || expo.killed) return;
  try {
    expo.kill('SIGINT');
  } catch {
    /* ignore */
  }
}

function printDnsFix() {
  console.log('\n  🔧 DNS en iPhone (si dice hostname not found):');
  console.log('     Ajustes → Wi‑Fi → (i) → DNS manual → 1.1.1.1 y 8.8.8.8\n');
}

function printHotspotFallback() {
  const lanUrl = getLanExpoUrl(PORT);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  🔥 OPCIÓN MÁS FIABLE: HOTSPOT + LAN');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n  1. iPhone → Ajustes → Compartir internet → ON');
  console.log('  2. Mac → Wi‑Fi → conectar a la red del iPhone');
  console.log('  3. Ctrl+C aquí → npm run dev:clear');
  console.log('  4. Espera "Metro waiting on exp://…"');
  if (lanUrl) {
    console.log('  5. Expo Go → Introducir URL → pega la URL de Metro');
    console.log(`     (aprox. ${lanUrl} tras conectar al hotspot)\n`);
  } else {
    console.log('  5. Expo Go → Introducir URL → pega exp://… de Metro\n');
  }
  console.log('  iOS: Ajustes → Expo Go → Red local → ON\n');
}

function printConnectionHelp({ proxyUrl, expUrl, loadingUrl, tunnelOk, bundleOk, dns }) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (bundleOk && tunnelOk) {
    console.log('  📱 LISTO — escanea en Expo Go');
  } else if (!tunnelOk) {
    console.log('  ❌ EL TÚNEL NO FUNCIONA — no uses el QR de abajo');
  } else {
    console.log('  📱 CONECTAR EXPO GO');
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (dns && dns.publicOk && !dns.localOk) {
    console.log('\n  ⚠️  Tu Mac no resuelve el host del túnel (*.trycloudflare.com).');
    console.log('     El iPhone probablemente tampoco → Expo Go no abre nada.');
    printDnsFix();
  }
  if (!bundleOk) {
    console.log('\n  ⚠️  Bundle aún compilando. Espera y pulsa Reload JS en Expo Go.');
  }
  if (!tunnelOk) {
    console.log('\n  ⚠️  El túnel no responde. La URL impresa NO abrirá Expo Go.');
    console.log('     Reinicia: Ctrl+C → npm run dev:cf');
    console.log('     O prueba: npm run dev:phone');
    printHotspotFallback();
    return;
  }
  console.log('\n  Expo Go → Introducir URL (más fiable que Cámara):\n');
  console.log(`  ${loadingUrl}\n`);
  qrcode.generate(loadingUrl, { small: true });
  console.log(`\n  Alternativa exp: ${expUrl}`);
  console.log('\n  • Deja ESTA terminal abierta');
  console.log('  • iOS: Ajustes → Expo Go → Red local → ON');
  console.log(`  • Túnel: ${proxyUrl}\n`);
}

async function attachTunnelAndPrintQr() {
  const metroUp = await new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${PORT}/status`, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });

  if (!metroUp) {
    console.error('\n❌ Metro no está en el puerto 8081.');
    console.error('   Primero: npm run dev:clear   (espera "Metro waiting on…")');
    console.error('   Luego:   npm run dev:cf:tunnel\n');
    process.exit(1);
  }

  console.log('✅ Metro detectado en 8081.\nIniciando túnel…\n');
  let tunnelHandle = null;
  let proxyUrl;
  let provider = 'cloudflared';
  try {
    const verified = await openVerifiedPublicTunnel({ quiet: true });
    tunnelHandle = verified.tunnel;
    provider = verified.provider;
    proxyUrl = verified.proxyUrl;
  } catch {
    printHotspotFallback();
    process.exit(1);
  }
  const expUrl = buildExpoGoUrlFromProxy(proxyUrl);
  const loadingUrl = buildExpoLoadingUrl(proxyUrl, 'ios');
  writeDevTunnelState({ proxyUrl, expUrl, loadingUrl });

  console.log(`\n  Túnel (${provider}): ${proxyUrl}\n`);
  console.log('⏳ Verificando túnel…');

  const hostname = getTunnelHostname(proxyUrl);
  const [tunnelOk, dns] = await Promise.all([
    waitForTunnelReachable(proxyUrl, 120_000),
    checkTunnelDns(hostname),
  ]);

  if (tunnelOk) console.log('✅ Túnel OK.');
  else console.log('⚠️  Túnel aún no responde; reintenta en 20 s o npm run dev:qr');

  printConnectionHelp({ proxyUrl, expUrl, loadingUrl, tunnelOk, bundleOk: true, dns });

  process.on('SIGINT', () => {
    stopTunnelProc(tunnelHandle);
    process.exit(0);
  });

  await new Promise(() => {});
}

async function main() {
  assertSupportedNode();

  if (TUNNEL_ONLY) {
    await attachTunnelAndPrintQr();
    return;
  }

  if (await isMetroRunning(PORT)) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Koraa — Expo Go vía túnel (dev:cf)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✅ Metro ya corre en 8081 — no lo reinicio.');
    console.log('  Abriendo túnel para Expo Go en el celular…\n');
    await attachTunnelAndPrintQr();
    return;
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Koraa — Expo Go vía túnel (dev:cf)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('Paso 1/3: Metro en 8081 (sin túnel aún)…');
  console.log('  La 1.ª vez puede tardar 5–15 min. No cierres esta terminal.\n');

  killPort(PORT);
  killPort(PORT + 1);

  let expo = startExpo({ clearCache: CLEAR_CACHE });
  let expoExited = false;
  let expoExitCode = null;
  expo.on('exit', (code) => {
    expoExited = true;
    expoExitCode = code ?? null;
  });

  let tunnelHandle = null;
  const cleanup = () => {
    stopTunnelProc(tunnelHandle);
    stopExpo(expo);
  };

  process.on('SIGINT', () => {
    cleanup();
    process.exit(0);
  });

  try {
    await waitForMetro(() => expoExited, METRO_COLD_TIMEOUT_MS, 'Metro (arranque en frío)');
    if (expoExited) {
      printExpoCrashHint(expo, expoExitCode);
      throw new Error('Expo terminó antes de que Metro respondiera');
    }

    console.log('\n✅ Metro OK.');
    console.log('\nPaso 2/3: Abriendo túnel (Metro ya escucha en 8081)…\n');

    const verified = await openVerifiedPublicTunnel({ quiet: true });
    tunnelHandle = verified.tunnel;
    const { proxyUrl, provider } = verified;
    const expUrl = buildExpoGoUrlFromProxy(proxyUrl);
    const loadingUrl = buildExpoLoadingUrl(proxyUrl, 'ios');
    writeDevTunnelState({ proxyUrl, expUrl, loadingUrl });

    console.log(`\n  Túnel (${provider}): ${proxyUrl}`);
    console.log('\nPaso 3/3: Reiniciando Metro con proxy (unos segundos)…\n');

    stopExpo(expo);
    await new Promise((r) => setTimeout(r, 1500));
    expoExited = false;
    expoExitCode = null;
    expo = startExpo({ proxyUrl, clearCache: false });
    expo.on('exit', (code) => {
      expoExited = true;
      expoExitCode = code ?? null;
    });

    await waitForMetro(() => expoExited, METRO_WARM_TIMEOUT_MS, 'Metro (con proxy)');
    if (expoExited) {
      printExpoCrashHint(expo, expoExitCode);
      throw new Error('Expo terminó al reiniciar con proxy');
    }

    console.log('\n✅ Metro OK con EXPO_PACKAGER_PROXY_URL.');
    const hostname = getTunnelHostname(proxyUrl);
    console.log('\n⏳ Preparando bundle iOS + túnel (1–5 min)…');

    const [bundleResult, tunnelOk, dns] = await Promise.all([
      warmUpMetroBundle(PORT, {
        maxMs: 600_000,
        onProgress: (seconds) => {
          process.stdout.write(`\r  Compilando bundle iOS… ${seconds}s`);
        },
      }),
      waitForTunnelReachable(proxyUrl, 120_000),
      checkTunnelDns(hostname),
    ]);

    process.stdout.write('\n');

    const bundleOk = bundleResult.ok;
    if (bundleOk) {
      console.log(
        `✅ Bundle listo (${Math.round(bundleResult.bytes / 1024)} KB en ${Math.round(bundleResult.elapsedMs / 1000)}s).`,
      );
    } else if (bundleResult.timedOut) {
      console.log('⚠️  Bundle tardó mucho. En Expo Go: espera y Reload JS.');
    }

    if (tunnelOk) console.log('✅ Túnel verificado.');
    else console.log('⚠️  El túnel dejó de responder.');

    printConnectionHelp({ proxyUrl, expUrl, loadingUrl, tunnelOk, bundleOk, dns });
  } catch (e) {
    if (e instanceof Error && e.message === 'TUNNEL_UNREACHABLE') {
      printHotspotFallback();
    }
    if (expoExited) {
      printExpoCrashHint(expo, expoExitCode);
    }
    console.error('\n❌', e instanceof Error ? e.message : e);
    if (expoExited) {
      console.log('\n  Si ves errores de sucrase, @expo/cli o "Cannot read properties":');
      console.log('    rm -rf node_modules && npm install');
    }
    console.log('\n  Forma más fiable (DOS terminales):');
    console.log('    Terminal A: npm run dev:clear   (espera "Metro waiting on…")');
    console.log('    Terminal B: npm run dev:cf:tunnel   (QR cuando Metro esté listo)');
    console.log('\n  O un solo comando: npm run dev:phone\n');
    if (!expoExited) {
      console.log('  Metro sigue corriendo en esta terminal si no lo cerraste.');
      console.log('  Cuando veas el QR de Metro, en otra terminal: npm run dev:cf:tunnel\n');
    } else {
      cleanup();
    }
    process.exit(1);
  }
}

main();
