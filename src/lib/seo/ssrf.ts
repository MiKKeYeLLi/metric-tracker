import dns from 'node:dns';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import type { Readable } from 'node:stream';
import zlib from 'node:zlib';
import { SeoCheckError } from './errors';

const MAX_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 5;
const TIMEOUT_MS = 10_000;
const USER_AGENT = 'MetricTrackerSEOBot/1.0 (on-page checker; static HTML only)';

const BLOCKED_MESSAGE =
  'That address points to a private or internal network, so it can’t be checked.';

/* ---------- IP classification (fails closed) ---------- */

function ipv4Blocked(p: number[]): boolean {
  const [a, b, c] = p;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) || // link-local, includes cloud metadata 169.254.169.254
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0 && (c === 0 || c === 2)) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224 // multicast, reserved, broadcast
  );
}

function parseIPv6(input: string): number[] | null {
  let ip = input.split('%')[0].toLowerCase();
  const m = ip.match(/^(.*:)(\d+\.\d+\.\d+\.\d+)$/);
  if (m) {
    const v4 = m[2].split('.').map(Number);
    if (v4.length !== 4 || v4.some((n) => !(n >= 0 && n <= 255))) return null;
    ip = m[1] + ((v4[0] << 8) | v4[1]).toString(16) + ':' + ((v4[2] << 8) | v4[3]).toString(16);
  }
  const halves = ip.split('::');
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(':') : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
  let groups: string[];
  if (halves.length === 2) {
    const fill = 8 - head.length - tail.length;
    if (fill < 1) return null;
    groups = [...head, ...Array<string>(fill).fill('0'), ...tail];
  } else {
    groups = head;
  }
  if (groups.length !== 8) return null;
  const nums = groups.map((g) => (/^[0-9a-f]{1,4}$/.test(g) ? parseInt(g, 16) : NaN));
  return nums.some((n) => Number.isNaN(n)) ? null : nums;
}

function ipv6Blocked(g: number[]): boolean {
  if (g.slice(0, 6).every((x) => x === 0)) return true; // ::, ::1, IPv4-compatible
  if (g.slice(0, 5).every((x) => x === 0) && g[5] === 0xffff) {
    return ipv4Blocked([g[6] >> 8, g[6] & 255, g[7] >> 8, g[7] & 255]); // IPv4-mapped
  }
  if ((g[0] & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local (includes fd00:ec2::254)
  if ((g[0] & 0xffc0) === 0xfe80) return true; // link-local
  if ((g[0] & 0xffc0) === 0xfec0) return true; // site-local
  if ((g[0] & 0xff00) === 0xff00) return true; // multicast
  if (g[0] === 0x64 && g[1] === 0xff9b) return true; // NAT64
  if (g[0] === 0x2001 && (g[1] === 0 || g[1] === 0xdb8)) return true; // Teredo, documentation
  if (g[0] === 0x2002) return ipv4Blocked([g[1] >> 8, g[1] & 255, g[2] >> 8, g[2] & 255]); // 6to4
  return false;
}

/** True for anything that is not a clearly public IP address. */
export function isBlockedIp(ip: string): boolean {
  if (net.isIPv4(ip)) return ipv4Blocked(ip.split('.').map(Number));
  if (net.isIPv6(ip)) {
    const g = parseIPv6(ip);
    return g === null ? true : ipv6Blocked(g);
  }
  return true;
}

/* ---------- URL handling ---------- */

/** Accepts "example.com" as well as full URLs. */
export function parseUserUrl(raw: string): URL {
  const trimmed = raw.trim();
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    return new URL(withScheme);
  } catch {
    throw new SeoCheckError('invalid_url', 'That doesn’t look like a valid web address.');
  }
}

/** Stable key for grouping checks of the same page. */
export function normalizeUrl(raw: string | URL): string {
  const u = typeof raw === 'string' ? parseUserUrl(raw) : new URL(raw.toString());
  u.hash = '';
  const path = u.pathname.replace(/\/+$/, '');
  return `${u.protocol}//${u.host}${path}${u.search}`;
}

function lookupAll(host: string): Promise<dns.LookupAddress[]> {
  return new Promise((resolve, reject) =>
    dns.lookup(host, { all: true, verbatim: true }, (err, addrs) => (err ? reject(err) : resolve(addrs))),
  );
}

/** Rejects non-http(s), credentials, odd ports, and hosts that resolve to private space. */
export async function assertPublicUrl(u: URL): Promise<void> {
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    throw new SeoCheckError('invalid_url', 'Only http and https addresses can be checked.');
  }
  if (u.username || u.password) {
    throw new SeoCheckError('invalid_url', 'Addresses with a username or password can’t be checked.');
  }
  if (u.port && u.port !== '80' && u.port !== '443') {
    throw new SeoCheckError('invalid_url', 'Only the standard web ports (80 and 443) can be checked.');
  }
  const host = u.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (!host) throw new SeoCheckError('invalid_url', 'That doesn’t look like a valid web address.');
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  ) {
    throw new SeoCheckError('blocked_address', BLOCKED_MESSAGE);
  }
  if (net.isIP(host)) {
    if (isBlockedIp(host)) throw new SeoCheckError('blocked_address', BLOCKED_MESSAGE);
    return;
  }
  let addrs: dns.LookupAddress[];
  try {
    addrs = await lookupAll(host);
  } catch {
    throw new SeoCheckError('not_found', 'We couldn’t find a website at that address.');
  }
  if (!addrs.length || addrs.some((a) => isBlockedIp(a.address))) {
    throw new SeoCheckError('blocked_address', BLOCKED_MESSAGE);
  }
}

/* ---------- Fetching ---------- */

/** Re-validates at connect time, so a hostname can't change to a private IP between check and connect. */
function guardedLookup(hostname: string, options: any, callback: any) {
  dns.lookup(hostname, { all: true, verbatim: true }, (err, addrs) => {
    if (err) return callback(err);
    if (!addrs.length || addrs.some((a) => isBlockedIp(a.address))) {
      return callback(new SeoCheckError('blocked_address', BLOCKED_MESSAGE));
    }
    if (options && options.all) return callback(null, addrs);
    return callback(null, addrs[0].address, addrs[0].family);
  });
}

export interface FetchedPage {
  finalUrl: string;
  statusCode: number;
  contentType: string;
  robotsHeader: string | null;
  html: string;
  sizeBytes: number;
  redirects: number;
  responseTimeMs: number;
  truncated: boolean;
}

function requestOnce(u: URL, signal: AbortSignal) {
  return new Promise<{ res: http.IncomingMessage; ttfbMs: number }>((resolve, reject) => {
    const started = Date.now();
    const lib: typeof http = u.protocol === 'https:' ? (https as unknown as typeof http) : http;
    const req = lib.request(
      u,
      {
        method: 'GET',
        signal,
        lookup: guardedLookup as any,
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.1',
          'Accept-Encoding': 'gzip, deflate, br',
        },
      },
      (res) => resolve({ res, ttfbMs: Date.now() - started }),
    );
    req.on('error', reject);
    req.end();
  });
}

function decoderFor(encoding: string | undefined) {
  switch ((encoding || '').toLowerCase()) {
    case 'gzip':
    case 'x-gzip':
      return zlib.createGunzip();
    case 'deflate':
      return zlib.createInflate();
    case 'br':
      return zlib.createBrotliDecompress();
    default:
      return null;
  }
}

async function readBody(res: http.IncomingMessage) {
  const dec = decoderFor(res.headers['content-encoding']);
  const src: Readable = dec ? res.pipe(dec) : res;
  const chunks: Buffer[] = [];
  let size = 0;
  let truncated = false;
  for await (const chunk of src) {
    const b = chunk as Buffer;
    if (size + b.length > MAX_BYTES) {
      chunks.push(b.subarray(0, MAX_BYTES - size));
      size = MAX_BYTES;
      truncated = true;
      res.destroy();
      break;
    }
    chunks.push(b);
    size += b.length;
  }
  return { buf: Buffer.concat(chunks), truncated };
}

export async function safeFetch(start: URL): Promise<FetchedPage> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
  try {
    let current = start;
    let redirects = 0;
    for (;;) {
      await assertPublicUrl(current);
      const { res, ttfbMs } = await requestOnce(current, ac.signal);
      const status = res.statusCode ?? 0;
      const location = res.headers.location;
      if (status >= 300 && status < 400 && location) {
        res.resume();
        if (redirects >= MAX_REDIRECTS) {
          throw new SeoCheckError('too_many_redirects', 'That address redirects too many times.');
        }
        current = new URL(location, current);
        redirects += 1;
        continue;
      }
      const contentType = String(res.headers['content-type'] || '').toLowerCase();
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
        res.destroy();
        throw new SeoCheckError('not_html', 'That address didn’t return a web page (HTML).');
      }
      const { buf, truncated } = await readBody(res);
      const robots = res.headers['x-robots-tag'];
      return {
        finalUrl: current.toString(),
        statusCode: status,
        contentType,
        robotsHeader: Array.isArray(robots) ? robots.join(', ') : robots ?? null,
        html: new TextDecoder('utf-8', { fatal: false }).decode(buf),
        sizeBytes: buf.length,
        redirects,
        responseTimeMs: ttfbMs,
        truncated,
      };
    }
  } catch (err: any) {
    if (err instanceof SeoCheckError) throw err;
    if (ac.signal.aborted) {
      throw new SeoCheckError('timeout', 'The page took too long to respond (over 10 seconds).');
    }
    if (err?.code === 'ENOTFOUND') {
      throw new SeoCheckError('not_found', 'We couldn’t find a website at that address.');
    }
    throw new SeoCheckError('fetch_failed', 'We couldn’t reach that address. Check it and try again.');
  } finally {
    clearTimeout(timer);
  }
}
