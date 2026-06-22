#!/usr/bin/env node
/**
 * URLs para Expo Go (alineadas con @expo/cli UrlCreator + túneles HTTPS).
 */
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { lookup } from 'node:dns/promises';

export const DEV_TUNNEL_STATE = path.join(process.cwd(), '.koraa-dev-tunnel.json');

/** Host público del túnel (cloudflared imprime https://). */
export function getTunnelHostname(proxyUrl) {
  return new URL(proxyUrl).hostname;
}

/**
 * URL que abre Expo Go vía página de carga (mejor en iPhone: Cámara o Expo Go).
 * https://host/_expo/loading?platform=ios
 */
export function buildExpoLoadingUrl(proxyUrl, platform = 'ios') {
  const host = getTunnelHostname(proxyUrl);
  return `https://${host}/_expo/loading?platform=${platform}`;
}

/**
 * Deep link exp:// (fallback Android / URL manual).
 * Con proxy HTTPS, Expo CLI usa puerto 443.
 */
export function buildExpoGoUrlFromProxy(proxyUrl) {
  const parsed = new URL(proxyUrl);
  const host = parsed.hostname;
  const port = parsed.port || (parsed.protocol === 'https:' ? '443' : '');
  return port ? `exp://${host}:${port}` : `exp://${host}`;
}

export function buildExpoGoUrlFromLan(ip, port = '8081') {
  return `exp://${ip}:${port}`;
}

/** IP LAN usable para Expo Go (misma Wi‑Fi o hotspot del iPhone). */
export function getLanExpoUrl(port = 8081) {
  const nets = os.networkInterfaces();
  const candidates = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] ?? []) {
      if (net.family !== 'IPv4' || net.internal) continue;
      if (!net.address || net.address.startsWith('127.') || net.address.startsWith('169.254.')) {
        continue;
      }
      candidates.push({ name, address: net.address });
    }
  }
  const preferred =
    candidates.find((c) => c.name === 'en0' && c.address.startsWith('192.168.')) ??
    candidates.find((c) => c.address.startsWith('192.168.')) ??
    candidates.find((c) => c.name === 'en0') ??
    candidates[0];
  return preferred ? buildExpoGoUrlFromLan(preferred.address, String(port)) : null;
}

export function writeDevTunnelState({ proxyUrl, expUrl, loadingUrl }) {
  const payload = JSON.stringify(
    {
      proxyUrl,
      expUrl,
      loadingUrl: loadingUrl ?? buildExpoLoadingUrl(proxyUrl),
      updatedAt: new Date().toISOString(),
    },
    null,
    2,
  );

  const tmpPath = `${DEV_TUNNEL_STATE}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(tmpPath, payload, 'utf8');
    fs.renameSync(tmpPath, DEV_TUNNEL_STATE);
  } catch (error) {
    try {
      fs.unlinkSync(tmpPath);
    } catch {
      /* ignore */
    }
    console.warn(
      `No se pudo guardar ${path.basename(DEV_TUNNEL_STATE)} (${error instanceof Error ? error.message : error}).`,
    );
    console.warn('El túnel sigue activo; copia la URL de la consola si Expo Go no la detecta.');
  }
}

export function readDevTunnelState() {
  try {
    return JSON.parse(fs.readFileSync(DEV_TUNNEL_STATE, 'utf8'));
  } catch {
    return null;
  }
}

export function isMetroRunning(port = 8081) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/status`, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function digShort(hostname, server) {
  try {
    const out = execSync(`dig +short ${hostname} @${server}`, {
      encoding: 'utf8',
      timeout: 8000,
    }).trim();
    return out.split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

/** Extrae la URL del quick tunnel (ignora api.trycloudflare.com). */
export function parseCloudflaredTunnelUrl(output) {
  const matches = output.matchAll(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/gi);
  for (const match of matches) {
    const url = match[0];
    try {
      if (new URL(url).hostname !== 'api.trycloudflare.com') return url;
    } catch {
      /* skip invalid */
    }
  }
  return null;
}

export async function checkTunnelDns(hostname) {
  let local = [];
  try {
    const results = await lookup(hostname, { all: true });
    local = results.map((r) => r.address);
  } catch {
    /* NXDOMAIN local */
  }
  const publicDns = digShort(hostname, '1.1.1.1');
  return {
    hostname,
    localOk: local.length > 0,
    publicOk: publicDns.length > 0,
    local,
    public: publicDns,
  };
}

/**
 * Precompila el bundle iOS en Metro antes de abrir Expo Go.
 * La primera compilación de Koraa puede tardar varios minutos sin enviar bytes.
 */
export function warmUpMetroBundle(port = 8081, { maxMs = 600_000, onProgress } = {}) {
  const bundlePath =
    '/node_modules/expo-router/entry.bundle?platform=ios&dev=true&minify=false&lazy=true';

  return new Promise((resolve) => {
    const started = Date.now();
    const progressTimer = setInterval(() => {
      onProgress?.(Math.round((Date.now() - started) / 1000));
    }, 10_000);
    onProgress?.(0);

    const finish = (result) => {
      clearInterval(progressTimer);
      resolve({ ...result, elapsedMs: Date.now() - started });
    };

    const req = http.get(`http://127.0.0.1:${port}${bundlePath}`, (res) => {
      let bytes = 0;
      res.on('data', (chunk) => {
        bytes += chunk.length;
      });
      res.on('end', () => {
        finish({ ok: res.statusCode === 200 && bytes > 0, bytes, statusCode: res.statusCode });
      });
    });

    req.on('error', (error) => {
      finish({
        ok: false,
        bytes: 0,
        error: error instanceof Error ? error.message : String(error),
      });
    });

    req.setTimeout(maxMs, () => {
      req.destroy();
      finish({ ok: false, bytes: 0, timedOut: true });
    });
  });
}

/** Espera a que el túnel responda (reintentos con backoff corto). */
export async function waitForTunnelReachable(proxyUrl, maxMs = 120_000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    if (await isTunnelReachable(proxyUrl, 10_000)) return true;
    await new Promise((r) => setTimeout(r, 3000));
  }
  return false;
}

/** Comprueba que el túnel responde (Metro a través de cloudflared). */
export async function isTunnelReachable(proxyUrl, maxMs = 12_000) {
  const base = proxyUrl.replace(/\/$/, '');
  const urls = [`${base}/status`, base];
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    for (const statusUrl of urls) {
      try {
        const res = await fetch(statusUrl, {
          signal: AbortSignal.timeout(8000),
          headers: { Accept: '*/*', 'User-Agent': 'koraa-dev-check' },
        });
        const body = await res.text();
        if (res.ok && (body.includes('packager-status:running') || statusUrl.endsWith('/status'))) {
          return true;
        }
      } catch {
        /* retry */
      }
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  return false;
}
