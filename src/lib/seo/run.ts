import { analyse } from './checks';
import { SeoCheckError } from './errors';
import { buildReport } from './scoring';
import { normalizeUrl, parseUserUrl, safeFetch } from './ssrf';
import type { CheckReport } from './types';

export async function runSeoCheck(rawUrl: string): Promise<CheckReport & { normalizedUrl: string; requestedUrl: string }> {
  const url = parseUserUrl(rawUrl);
  const page = await safeFetch(url);
  if (!page.html.trim()) throw new SeoCheckError('empty', 'That page came back empty.');
  const { results, snapshot } = analyse(
    page.html,
    {
      finalUrl: page.finalUrl,
      statusCode: page.statusCode,
      responseTimeMs: page.responseTimeMs,
      redirects: page.redirects,
      sizeBytes: page.sizeBytes,
      robotsHeader: page.robotsHeader,
    },
    url.toString(),
  );
  return { ...buildReport(results, snapshot), normalizedUrl: normalizeUrl(url), requestedUrl: url.toString() };
}
