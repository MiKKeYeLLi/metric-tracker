// Needs the `cheerio` package installed (npm i cheerio).
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { analyse } from '../checks';
import { buildReport } from '../scoring';
import type { FetchInfo } from '../types';

const fetchOk: FetchInfo = { finalUrl: 'https://example.com/post', statusCode: 200, responseTimeMs: 300, redirects: 0, sizeBytes: 5000, robotsHeader: null };
const words = (n: number) => Array.from({ length: n }, (_, i) => `word${i}`).join(' ');
const run = (html: string, f: FetchInfo = fetchOk) => analyse(html, f, f.finalUrl);
const outcome = (res: ReturnType<typeof run>, id: string) => res.results.find((r) => r.id === id)!.outcome;

const good = `<!doctype html><html lang="en"><head>
<title>A well written title that is the right length</title>
<meta name="description" content="A clear description of this page that is comfortably within the recommended length for search results.">
<link rel="canonical" href="https://example.com/post"><meta name="viewport" content="width=device-width, initial-scale=1">
</head><body><h1>Main heading</h1><h2>Section</h2><p>${words(320)}</p>
<img src="a.png" alt="A chart"><a href="/about">About us</a><a href="https://other.org/x">Other</a></body></html>`;

describe('analyse', () => {
  it('passes every check on a well formed page', () => {
    const res = run(good);
    assert.deepEqual(res.results.filter((r) => r.outcome !== 'pass').map((r) => r.id), []);
    assert.equal(buildReport(res.results, res.snapshot).score, 100);
    assert.equal(res.snapshot.internalLinks, 1);
    assert.equal(res.snapshot.externalLinks, 1);
    assert.equal(res.snapshot.indexable, true);
  });

  it('flags the problems in the design mockup', () => {
    const bad = `<html><head><title>Hi</title>
<meta name="description" content="one"><meta name="description" content="two">
<link rel="canonical" href="/a"><link rel="canonical" href="/b">
<meta http-equiv="refresh" content="0; url=/new"></head><body><h1>A</h1><h1>B</h1><h3>Skipped</h3>
<img src="x.png"><a href="/x"><span></span></a></body></html>`;
    const res = run(bad);
    assert.equal(outcome(res, 'title-length'), 'warn');
    assert.equal(outcome(res, 'description-single'), 'fail');
    assert.equal(outcome(res, 'canonical-single'), 'fail');
    assert.equal(outcome(res, 'meta-refresh'), 'fail');
    assert.equal(outcome(res, 'h1-count'), 'warn'); // more than one h1 is a warning
    assert.equal(res.results.find((r) => r.id === 'h1-count')!.severity, 'warning');
    assert.equal(outcome(res, 'heading-order'), 'warn');
    assert.equal(outcome(res, 'image-alt'), 'warn');
    assert.equal(outcome(res, 'empty-anchor-text'), 'warn');
    assert.equal(outcome(res, 'viewport'), 'warn');
    assert.equal(outcome(res, 'word-count'), 'warn');
  });

  it('treats a missing h1 as an error', () => {
    const res = run('<html><head><title>x</title></head><body><p>hi</p></body></html>');
    assert.equal(outcome(res, 'h1-count'), 'fail');
  });

  it('detects noindex in meta and header', () => {
    assert.equal(outcome(run('<html><head><meta name="ROBOTS" content="noindex, follow"></head><body></body></html>'), 'robots-noindex'), 'fail');
    assert.equal(outcome(run(good, { ...fetchOk, robotsHeader: 'noindex' }), 'robots-noindex'), 'fail');
  });

  it('does not count scripts or styles as words', () => {
    const res = run(`<html><body><script>${words(500)}</script><style>${words(500)}</style><p>one two</p></body></html>`);
    assert.equal(res.snapshot.wordCount, 2);
  });

  it('checks server facts', () => {
    const res = run(good, { ...fetchOk, finalUrl: 'http://example.com/', statusCode: 404, responseTimeMs: 2500, redirects: 3, sizeBytes: 300_000 });
    for (const id of ['status-200', 'https']) assert.equal(outcome(res, id), 'fail');
    for (const id of ['response-time', 'redirect-chain', 'html-size']) assert.equal(outcome(res, id), 'warn');
    assert.equal(res.snapshot.indexable, false);
  });
});
