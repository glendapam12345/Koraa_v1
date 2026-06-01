#!/usr/bin/env node
/**
 * Metro en 8081 + cloudflared + EXPO_PACKAGER_PROXY_URL (Expo Go en celular).
 * Uso: npm run dev:cf
 */
import { spawn } from 'node:child_process';
import http from 'node:http';
import { execSync } from 'node:child_process';

const PORT = 8081;
const CLOUDFLARED = process.env.CLOUDFLARED_PATH || 'cloudflared';

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

function waitForMetro(maxMs = 120_000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
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
      if (Date.now() - start > maxMs) reject(new Error('Metro no arrancó'));
      else setTimeout(tick, 600);
    };
    tick();
  });
}

function startCloudflared() {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      CLOUDFLARED,
      ['tunnel', '--url', `http://127.0.0.1:${PORT}`],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    );

    let buf = '';
    const onData = (c) => {
      buf += c.toString();
      const m = buf.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
      if (m) {
        clearTimeout(timer);
        resolve({ url: m[0], proc });
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
    }, 90_000);
  });
}

function startExpo(proxyUrl) {
  return spawn('npx', ['expo', 'start', '--port', String(PORT), '--lan'], {
    env: {
      ...process.env,
      EXPO_PACKAGER_PROXY_URL: proxyUrl,
      REACT_NATIVE_PACKAGER_PORT: String(PORT),
      EXPO_NO_TELEMETRY: '1',
    },
    stdio: 'inherit',
    shell: false,
  });
}

async function main() {
  console.log('Liberando puerto 8081…');
  killPort(PORT);
  killPort(8082);

  console.log('Iniciando cloudflared…');
  let tunnel;
  try {
    tunnel = await startCloudflared();
  } catch (e) {
    console.error('❌', e instanceof Error ? e.message : e);
    process.exit(1);
  }

  const proxyUrl = tunnel.url;
  const expUrl = `exp://${new URL(proxyUrl).hostname}`;

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Túnel:', proxyUrl);
  console.log('  Expo Go (escanear QR o enlace en Notas):');
  console.log(' ', expUrl);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('Iniciando Metro en 8081 (no uses el puerto 8082)…\n');

  const expo = startExpo(proxyUrl);

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

  expo.on('exit', () => {
    try {
      tunnel.proc.kill('SIGTERM');
    } catch {
      /* ignore */
    }
  });

  try {
    await waitForMetro();
    console.log('\n✅ Listo. Escanea el QR (debe mostrar trycloudflare.com, sin :8081).\n');
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    cleanup();
    process.exit(1);
  }
}

main();
