import * as cheerio from 'cheerio';
import { SEVERITY_WEIGHT, THRESHOLDS } from './config';
import type { CategoryId, CheckResult, FetchInfo, Severity, Snapshot } from './types';

type $ = cheerio.CheerioAPI;

interface Def {
  id: string;
  category: CategoryId;
  label: string;
  severity: Severity;
  fix: string;
}

interface Ctx {
  $: $;
  base: URL;
  fetch: FetchInfo;
  anchors: { internal: boolean; emptyText: boolean }[];
  wordCount: number;
  title: string;
  description: string;
  noindex: boolean;
}

/** Unmet checks become "fail" for errors and "warn" for warnings and tips. */
function make(d: Def, ok: boolean, detail: string, severityIfUnmet?: Severity): CheckResult {
  const severity = ok ? d.severity : severityIfUnmet ?? d.severity;
  return {
    id: d.id,
    category: d.category,
    label: d.label,
    severity,
    weight: SEVERITY_WEIGHT[d.severity],
    outcome: ok ? 'pass' : severity === 'error' ? 'fail' : 'warn',
    detail,
    fix: d.fix,
  };
}

const D = {
  titlePresent: { id: 'title-present', category: 'meta', label: 'Title is present', severity: 'error', fix: 'Add a unique <title> inside <head> that describes the page.' },
  titleLength: { id: 'title-length', category: 'meta', label: 'Title length is 30–60 characters', severity: 'warning', fix: 'Rewrite the title so it is long enough to be descriptive but short enough not to be cut off in search results.' },
  descPresent: { id: 'description-present', category: 'meta', label: 'Meta description is present', severity: 'error', fix: 'Add <meta name="description" content="…"> summarising the page.' },
  descLength: { id: 'description-length', category: 'meta', label: 'Meta description length is 70–160 characters', severity: 'warning', fix: 'Rewrite the description so it is clear, specific and fits in search results.' },
  descSingle: { id: 'description-single', category: 'meta', label: 'Only one meta description tag', severity: 'error', fix: 'Remove the extra meta description tags. Search engines may ignore all of them when they conflict.' },
  canonicalSingle: { id: 'canonical-single', category: 'meta', label: 'Only one canonical link', severity: 'error', fix: 'Keep a single <link rel="canonical"> pointing at the preferred address of this page.' },
  noindex: { id: 'robots-noindex', category: 'meta', label: 'Page is not blocked from indexing', severity: 'error', fix: 'Remove noindex from the meta robots tag or the X-Robots-Tag header if this page should appear in search.' },
  metaRefresh: { id: 'meta-refresh', category: 'meta', label: 'No meta refresh redirect', severity: 'error', fix: 'Replace the meta refresh with a server-side HTTP redirect (301 or 302).' },
  htmlLang: { id: 'html-lang', category: 'meta', label: 'Page language is declared', severity: 'tip', fix: 'Add a lang attribute to the <html> element, for example lang="en".' },
  h1: { id: 'h1-count', category: 'structure', label: 'Exactly one main heading (h1)', severity: 'error', fix: 'Use one <h1> that states what the page is about, and use <h2> and below for sections.' },
  headingSkip: { id: 'heading-order', category: 'structure', label: 'Heading levels do not skip', severity: 'tip', fix: 'Do not jump from, for example, h1 straight to h3. Step down one level at a time.' },
  hasH2: { id: 'has-h2', category: 'structure', label: 'Page has section headings (h2)', severity: 'tip', fix: 'Break the content into sections with <h2> headings.' },
  words: { id: 'word-count', category: 'quality', label: 'At least 300 words of text', severity: 'warning', fix: 'Add useful content. Very thin pages rarely rank well.' },
  imgAlt: { id: 'image-alt', category: 'quality', label: 'Images have alt text', severity: 'warning', fix: 'Add a short description in the alt attribute of each image.' },
  viewport: { id: 'viewport', category: 'quality', label: 'Mobile viewport is set', severity: 'warning', fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">.' },
  internalLink: { id: 'internal-links', category: 'links', label: 'Links to other pages on the site', severity: 'tip', fix: 'Link to related pages on your own site so visitors and search engines can find them.' },
  emptyAnchor: { id: 'empty-anchor-text', category: 'links', label: 'Every link has readable text', severity: 'warning', fix: 'Give each link descriptive text, or an aria-label if it only contains an icon.' },
  status: { id: 'status-200', category: 'server', label: 'Page responds with status 200', severity: 'error', fix: 'Make sure the page returns 200 OK. Error pages and unexpected redirects hurt search visibility.' },
  https: { id: 'https', category: 'server', label: 'Served over HTTPS', severity: 'error', fix: 'Serve the page over HTTPS and redirect http:// addresses to it.' },
  speed: { id: 'response-time', category: 'server', label: 'Responds in under 1 second', severity: 'warning', fix: 'Reduce server response time with caching, a closer host or faster rendering.' },
  redirects: { id: 'redirect-chain', category: 'server', label: 'Two redirects or fewer', severity: 'warning', fix: 'Link directly to the final address so visitors are not bounced through several redirects.' },
  size: { id: 'html-size', category: 'server', label: 'HTML is under 200 kB', severity: 'tip', fix: 'Trim inline scripts and styles and unneeded markup.' },
} satisfies Record<string, Def>;

function buildCtx(html: string, fetchInfo: FetchInfo): Ctx {
  const $ = cheerio.load(html);
  const base = new URL(fetchInfo.finalUrl);
  const baseHost = base.hostname.replace(/^www\./, '');

  const body = $('body').clone();
  body.find('script,style,noscript,template').remove();
  const text = body.text().replace(/\s+/g, ' ').trim();
  const wordCount = text ? text.split(' ').length : 0;

  const anchors: Ctx['anchors'] = [];
  $('a[href]').each((_, el) => {
    const a = $(el);
    const href = (a.attr('href') || '').trim();
    if (!href || /^(#|javascript:|mailto:|tel:|data:)/i.test(href)) return;
    let target: URL;
    try {
      target = new URL(href, base);
    } catch {
      return;
    }
    if (target.protocol !== 'http:' && target.protocol !== 'https:') return;
    const imgAlt = a.find('img[alt]').toArray().some((i) => ($(i).attr('alt') || '').trim() !== '');
    const emptyText = !a.text().trim() && !(a.attr('aria-label') || '').trim() && !(a.attr('title') || '').trim() && !imgAlt;
    anchors.push({ internal: target.hostname.replace(/^www\./, '') === baseHost, emptyText });
  });

  const robotsMeta = ($('meta[name="robots" i]').attr('content') || '').toLowerCase();
  const noindex = robotsMeta.includes('noindex') || (fetchInfo.robotsHeader || '').toLowerCase().includes('noindex');

  return {
    $,
    base,
    fetch: fetchInfo,
    anchors,
    wordCount,
    title: $('head title').first().text().trim(),
    description: ($('meta[name="description" i]').first().attr('content') || '').trim(),
    noindex,
  };
}

function runAll(c: Ctx): CheckResult[] {
  const { $, fetch: f } = c;
  const T = THRESHOLDS;
  const descCount = $('meta[name="description" i]').length;
  const canonicalCount = $('link[rel~="canonical" i]').length;
  const h1Count = $('h1').length;
  const levels = $('h1,h2,h3,h4,h5,h6').toArray().map((el) => Number((el as unknown as { tagName: string }).tagName.slice(1)));
  const skip = levels.find((lvl, i) => i > 0 && lvl > levels[i - 1] + 1);
  const imgs = $('img').toArray();
  const missingAlt = imgs.filter((i) => !($(i).attr('alt') || '').trim()).length;
  const internal = c.anchors.filter((a) => a.internal).length;
  const emptyLinks = c.anchors.filter((a) => a.emptyText).length;
  const tl = c.title.length;
  const dl = c.description.length;

  return [
    make(D.titlePresent, tl > 0, tl > 0 ? 'A title is set.' : 'No <title> was found.'),
    make(D.titleLength, tl >= T.titleMin && tl <= T.titleMax, tl === 0 ? 'Add a title first.' : `The title is ${tl} characters (aim for ${T.titleMin}–${T.titleMax}).`),
    make(D.descPresent, dl > 0, dl > 0 ? 'A meta description is set.' : 'No meta description was found.'),
    make(D.descLength, dl >= T.descriptionMin && dl <= T.descriptionMax, dl === 0 ? 'Add a description first.' : `The description is ${dl} characters (aim for ${T.descriptionMin}–${T.descriptionMax}).`),
    make(D.descSingle, descCount <= 1, descCount <= 1 ? 'No duplicate description tags.' : `Found ${descCount} meta description tags.`),
    make(D.canonicalSingle, canonicalCount <= 1, canonicalCount <= 1 ? (canonicalCount === 1 ? 'One canonical link is set.' : 'No canonical link is set.') : `Found ${canonicalCount} canonical links.`),
    make(D.noindex, !c.noindex, c.noindex ? 'The page tells search engines not to index it.' : 'The page can be indexed.'),
    make(D.metaRefresh, $('meta[http-equiv="refresh" i]').length === 0, $('meta[http-equiv="refresh" i]').length === 0 ? 'No meta refresh found.' : 'A meta refresh redirect is present.'),
    make(D.htmlLang, ($('html').attr('lang') || '').trim() !== '', ($('html').attr('lang') || '').trim() !== '' ? `Language is "${$('html').attr('lang')}".` : 'No lang attribute on <html>.'),
    make(D.h1, h1Count === 1, h1Count === 1 ? 'One h1 found.' : h1Count === 0 ? 'No h1 found.' : `Found ${h1Count} h1 headings.`, h1Count > 1 ? 'warning' : 'error'),
    make(D.headingSkip, skip === undefined, skip === undefined ? 'Heading levels step down in order.' : `A heading jumps to level ${skip} without the level above it.`),
    make(D.hasH2, $('h2').length > 0, $('h2').length > 0 ? 'Section headings found.' : 'No h2 headings found.'),
    make(D.words, c.wordCount >= T.minWords, `The page has ${c.wordCount} words (aim for ${T.minWords} or more).`),
    make(D.imgAlt, missingAlt === 0, imgs.length === 0 ? 'No images on the page.' : missingAlt === 0 ? 'All images have alt text.' : `${missingAlt} of ${imgs.length} images are missing alt text.`),
    make(D.viewport, $('meta[name="viewport" i]').length > 0, $('meta[name="viewport" i]').length > 0 ? 'Viewport meta tag found.' : 'No viewport meta tag.'),
    make(D.internalLink, internal > 0, `${internal} internal link${internal === 1 ? '' : 's'} found.`),
    make(D.emptyAnchor, emptyLinks === 0, emptyLinks === 0 ? 'All links have text.' : `${emptyLinks} link${emptyLinks === 1 ? ' has' : 's have'} no readable text.`),
    make(D.status, f.statusCode === 200, `The page responded with status ${f.statusCode}.`),
    make(D.https, c.base.protocol === 'https:', c.base.protocol === 'https:' ? 'The page is served over HTTPS.' : 'The page is served over plain HTTP.'),
    make(D.speed, f.responseTimeMs < T.maxResponseMs, `The server responded in ${(f.responseTimeMs / 1000).toFixed(2)} seconds.`),
    make(D.redirects, f.redirects <= T.maxRedirects, `${f.redirects} redirect${f.redirects === 1 ? '' : 's'} before the final page.`),
    make(D.size, f.sizeBytes < T.maxHtmlBytes, `The HTML is ${(f.sizeBytes / 1000).toFixed(0)} kB.`),
  ];
}

export function analyse(html: string, fetchInfo: FetchInfo, requestedUrl: string): { results: CheckResult[]; snapshot: Snapshot } {
  const c = buildCtx(html, fetchInfo);
  const results = runAll(c);
  const snapshot: Snapshot = {
    title: c.title || null,
    description: c.description || null,
    url: requestedUrl,
    finalUrl: fetchInfo.finalUrl,
    statusCode: fetchInfo.statusCode,
    indexable: !c.noindex && fetchInfo.statusCode >= 200 && fetchInfo.statusCode < 300,
    language: (c.$('html').attr('lang') || '').trim() || null,
    responseTimeMs: fetchInfo.responseTimeMs,
    sizeBytes: fetchInfo.sizeBytes,
    wordCount: c.wordCount,
    internalLinks: c.anchors.filter((a) => a.internal).length,
    externalLinks: c.anchors.filter((a) => !a.internal).length,
    redirects: fetchInfo.redirects,
  };
  return { results, snapshot };
}
