import type { CategoryId, Severity } from './types';

/** Everything tunable lives here. */
export const CATEGORY_LABELS: Record<CategoryId, string> = {
  meta: 'Meta data',
  structure: 'Page structure',
  quality: 'Page quality',
  links: 'Links',
  server: 'Server',
};

export const CATEGORY_ORDER: CategoryId[] = ['meta', 'structure', 'quality', 'links', 'server'];

/** Weight of each category in the overall score. */
export const CATEGORY_WEIGHTS: Record<CategoryId, number> = {
  meta: 30,
  structure: 15,
  quality: 20,
  links: 10,
  server: 25,
};

/** Weight of a single check, by how important it is. */
export const SEVERITY_WEIGHT: Record<Severity, number> = { error: 3, warning: 2, tip: 1 };

export const IMPORTANCE_LABEL: Record<Severity, string> = {
  error: 'Very important',
  warning: 'Important',
  tip: 'Nice to have',
};

export const THRESHOLDS = {
  titleMin: 30,
  titleMax: 60,
  descriptionMin: 70,
  descriptionMax: 160,
  minWords: 300,
  maxResponseMs: 1000,
  maxRedirects: 2,
  maxHtmlBytes: 200_000,
};

export const SCORE_BANDS = { good: 80, needsWork: 50 };

export function scoreLabel(score: number): 'Good' | 'Needs work' | 'Poor' {
  if (score >= SCORE_BANDS.good) return 'Good';
  if (score >= SCORE_BANDS.needsWork) return 'Needs work';
  return 'Poor';
}
