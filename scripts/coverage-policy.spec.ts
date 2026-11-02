import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import config from '../vitest.config.ts';

const coverage = config.test?.coverage;
const thresholds = coverage?.thresholds;
const target = (minimum: number) => ({
  lines: minimum,
  functions: minimum,
  branches: minimum,
  statements: minimum,
});

describe('coverage policy', () => {
  it('gates each package independently so unrelated coverage cannot hide a regression', () => {
    for (const entry of readdirSync(new URL('../packages', import.meta.url), {
      withFileTypes: true,
    })) {
      if (!entry.isDirectory()) continue;
      expect(thresholds).toHaveProperty(
        `packages/${entry.name}/**`,
        target(['core', 'components'].includes(entry.name) ? 80 : 60),
      );
    }
  });
  it('preserves the stronger DI kernel constraint', () => {
    expect(thresholds).toHaveProperty('packages/core/src/di/**', target(95));
  });
  it('counts Vue components and secondary entries while excluding generated proxies', () => {
    expect(coverage?.include).toEqual([
      'packages/*/src/**/*.{ts,vue}',
      'packages/*/*/src/**/*.{ts,vue}',
    ]);
    expect(coverage?.exclude).toEqual([
      '**/*.spec.ts',
      '**/*.test-d.ts',
      '**/index.ts',
      'packages/*/proxy/src/**',
      'packages/*/src/proxy/**',
    ]);
  });
});
