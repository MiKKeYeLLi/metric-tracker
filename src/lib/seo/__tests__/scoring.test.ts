import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildReport, categoryScore, overallScore, todoList } from '../scoring';
import type { CheckResult, Snapshot } from '../types';

const r = (p: Partial<CheckResult>): CheckResult => ({
  id: 'x', category: 'meta', label: 'x', severity: 'error', weight: 3, outcome: 'pass', detail: '', fix: '', ...p,
});
const snap = {} as Snapshot;

describe('scoring', () => {
  it('scores a category from passed and half-credit warned weights', () => {
    const results = [r({ weight: 3 }), r({ weight: 2, outcome: 'warn', severity: 'warning' }), r({ weight: 3, outcome: 'fail' })];
    // (3 + 1 + 0) / 8 = 50%
    assert.equal(categoryScore(results, 'meta'), 50);
  });

  it('returns null for a category with no checks', () => {
    assert.equal(categoryScore([r({})], 'server'), null);
  });

  it('averages categories by their weights and skips empty ones', () => {
    // meta 30 weight at 100, structure 15 weight at 0 -> 3000 / 45 = 66.67 -> 67
    assert.equal(overallScore({ meta: 100, structure: 0, quality: null, links: null, server: null }), 67);
  });

  it('counts only failed error-level checks as errors', () => {
    const report = buildReport(
      [r({ outcome: 'fail' }), r({ outcome: 'warn', severity: 'warning' }), r({ outcome: 'fail', severity: 'error' }), r({})],
      snap,
    );
    assert.equal(report.errorCount, 2);
  });

  it('sorts the to-do list by severity, fails before warnings, and drops passes', () => {
    const list = todoList([
      r({ id: 'tip', severity: 'tip', outcome: 'warn' }),
      r({ id: 'warn', severity: 'warning', outcome: 'warn' }),
      r({ id: 'ok' }),
      r({ id: 'err', severity: 'error', outcome: 'fail' }),
      r({ id: 'errwarn', severity: 'error', outcome: 'warn' }),
    ]);
    assert.deepEqual(list.map((x) => x.id), ['err', 'errwarn', 'warn', 'tip']);
  });
});
