export type Severity = 'error' | 'warning' | 'tip';
export type Outcome = 'pass' | 'warn' | 'fail';
export type CategoryId = 'meta' | 'structure' | 'quality' | 'links' | 'server';

export interface CheckResult {
  id: string;
  category: CategoryId;
  label: string;
  severity: Severity;
  weight: number;
  outcome: Outcome;
  detail: string;
  fix: string;
}

export interface Snapshot {
  title: string | null;
  description: string | null;
  url: string;
  finalUrl: string;
  statusCode: number;
  indexable: boolean;
  language: string | null;
  responseTimeMs: number;
  sizeBytes: number;
  wordCount: number;
  internalLinks: number;
  externalLinks: number;
  redirects: number;
}

export type CategoryScores = Record<CategoryId, number | null>;

export interface CheckReport {
  score: number;
  categoryScores: CategoryScores;
  errorCount: number;
  snapshot: Snapshot;
  results: CheckResult[];
}

export interface FetchInfo {
  finalUrl: string;
  statusCode: number;
  responseTimeMs: number;
  redirects: number;
  sizeBytes: number;
  robotsHeader: string | null;
}
