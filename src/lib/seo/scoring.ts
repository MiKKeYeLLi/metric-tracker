import { CATEGORY_ORDER, CATEGORY_WEIGHTS } from './config';
import type { CategoryId, CategoryScores, CheckReport, CheckResult, Snapshot } from './types';

/** (passed weight + half of warned weight) / total weight, as 0-100. null if the category has no checks. */
export function categoryScore(results: CheckResult[], category: CategoryId): number | null {
  const inCat = results.filter((r) => r.category === category);
  const total = inCat.reduce((s, r) => s + r.weight, 0);
  if (total === 0) return null;
  const earned = inCat.reduce(
    (s, r) => s + (r.outcome === 'pass' ? r.weight : r.outcome === 'warn' ? r.weight / 2 : 0),
    0,
  );
  return Math.round((earned / total) * 100);
}

export function overallScore(scores: CategoryScores): number {
  let sum = 0;
  let weights = 0;
  for (const c of CATEGORY_ORDER) {
    const v = scores[c];
    if (v === null) continue;
    sum += v * CATEGORY_WEIGHTS[c];
    weights += CATEGORY_WEIGHTS[c];
  }
  return weights === 0 ? 0 : Math.round(sum / weights);
}

const SEVERITY_RANK = { error: 0, warning: 1, tip: 2 } as const;

/** Failed and warned checks, most important first (fails before warnings within a severity). */
export function todoList(results: CheckResult[]): CheckResult[] {
  return results
    .filter((r) => r.outcome !== 'pass')
    .sort(
      (a, b) =>
        SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
        (a.outcome === b.outcome ? 0 : a.outcome === 'fail' ? -1 : 1),
    );
}

export function buildReport(results: CheckResult[], snapshot: Snapshot): CheckReport {
  const categoryScores = Object.fromEntries(
    CATEGORY_ORDER.map((c) => [c, categoryScore(results, c)]),
  ) as CategoryScores;
  return {
    score: overallScore(categoryScores),
    categoryScores,
    errorCount: results.filter((r) => r.outcome === 'fail' && r.severity === 'error').length,
    snapshot,
    results,
  };
}
