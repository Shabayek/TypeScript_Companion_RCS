// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { validateContent } from '../scripts/validateContent';
import { ALL_LESSONS, MODULES } from '../src/content/curriculum';

describe('content', () => {
  it('has a course to teach', () => {
    expect(ALL_LESSONS.length).toBeGreaterThan(20);
    expect(MODULES.length).toBeGreaterThanOrEqual(8);
    expect(new Set(MODULES.map((module) => module.track)).size).toBeGreaterThan(1);
  });

  it('passes every schema, link, and grading-fixture check', async () => {
    const issues = await validateContent();
    const report = issues.map((issue) => `${issue.where}: ${issue.message}`).join('\n');
    expect(report).toBe('');
    expect(issues).toHaveLength(0);
  }, 180_000);
});
