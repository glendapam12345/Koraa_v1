#!/usr/bin/env node
/**
 * URLs para Expo Go (alineadas con @expo/cli UrlCreator + túneles HTTPS).
 */
import fs from 'node:fs';
import http from 'node:http';
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

export function writeDevTunnelState({ proxyUrl, expUrl, loadingUrl }) {
  fs.writeFileSync(
    DEV_TUNNEL_STATE,
    JSON.stringify(
      {
        proxyUrl,
        expUrl,
        loadingUrl: loadingUrl ?? buildExpoLoadingUrl(proxyUrl),
        updatedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
    'utf8',
  );
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

/** El router/Wi‑Fi a veces no resuelve *.trycloudflare.com (NXDOMAIN). */
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
