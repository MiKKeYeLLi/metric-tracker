import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { assertPublicUrl, isBlockedIp, normalizeUrl, parseUserUrl } from '../ssrf';

describe('isBlockedIp', () => {
  const blocked = [
    '127.0.0.1', '10.1.2.3', '172.16.0.1', '172.31.255.255', '192.168.1.1', '169.254.169.254', '0.0.0.0',
    '100.64.0.1', '224.0.0.1', '255.255.255.255', '::', '::1', 'fe80::1', 'fc00::1', 'fd00:ec2::254',
    '::ffff:127.0.0.1', '::ffff:7f00:1', '::ffff:169.254.169.254', 'ff02::1', '64:ff9b::7f00:1', '2001:db8::1',
    '2002:7f00:1::', 'not-an-ip', '',
  ];
  const allowed = ['8.8.8.8', '1.1.1.1', '172.15.0.1', '172.32.0.1', '93.184.216.34', '2606:4700:4700::1111', '::ffff:8.8.8.8'];
  for (const ip of blocked) it(`blocks ${ip || '(empty)'}`, () => assert.equal(isBlockedIp(ip), true));
  for (const ip of allowed) it(`allows ${ip}`, () => assert.equal(isBlockedIp(ip), false));
});

describe('assertPublicUrl', () => {
  const bad: [string, string][] = [
    ['ftp://example.com/', 'invalid_url'],
    ['file:///etc/passwd', 'invalid_url'],
    ['https://user:pw@example.com/', 'invalid_url'],
    ['https://example.com:8080/', 'invalid_url'],
    ['http://localhost/', 'blocked_address'],
    ['http://app.localhost/', 'blocked_address'],
    ['http://printer.local/', 'blocked_address'],
    ['http://127.0.0.1/', 'blocked_address'],
    ['http://2130706433/', 'blocked_address'], // decimal form of 127.0.0.1
    ['http://0x7f.1/', 'blocked_address'],
    ['http://[::1]/', 'blocked_address'],
    ['http://[::ffff:127.0.0.1]/', 'blocked_address'],
    ['http://169.254.169.254/latest/meta-data/', 'blocked_address'],
  ];
  for (const [url, code] of bad) {
    it(`rejects ${url}`, async () => {
      await assert.rejects(() => assertPublicUrl(new URL(url)), (e: any) => e.code === code);
    });
  }
  it('accepts a public IP literal', async () => {
    await assertPublicUrl(new URL('https://8.8.8.8/'));
  });
});

describe('url helpers', () => {
  it('adds https when no scheme is given', () => assert.equal(parseUserUrl('example.com/a').protocol, 'https:'));
  it('rejects nonsense', () => assert.throws(() => parseUserUrl('http://'), (e: any) => e.code === 'invalid_url'));
  it('normalises case, fragment, trailing slash and default port', () => {
    assert.equal(normalizeUrl('HTTPS://Example.com:443/Blog/#top'), 'https://example.com/Blog');
    assert.equal(normalizeUrl('https://example.com/'), 'https://example.com');
    assert.equal(normalizeUrl('example.com/a/?x=1'), 'https://example.com/a?x=1');
  });
});
