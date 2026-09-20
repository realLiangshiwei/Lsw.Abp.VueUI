import { describe, expect, it } from 'vitest';
import { failed, formatChecks, type Check } from './checks.js';

const CHECKS: Check[] = [
  { name: 'node', status: 'ok', detail: '22.14' },
  {
    name: 'redirect uri',
    status: 'fail',
    detail: 'not allowed',
    fix: 'abpv switch-ui --port 5173',
  },
];

describe('formatChecks', () => {
  it('lines the details up and puts the fix under the thing it fixes', () => {
    expect(formatChecks(CHECKS)).toBe(
      [
        '✔ node          22.14',
        '✖ redirect uri  not allowed',
        '                → abpv switch-ui --port 5173',
      ].join('\n'),
    );
  });

  it('is nothing when there was nothing to check', () => {
    expect(formatChecks([])).toBe('');
  });
});

describe('failed', () => {
  it('is what stops a command, and a warning is not one of them', () => {
    expect(failed([...CHECKS, { name: 'proxy', status: 'warn', detail: 'stale' }])).toEqual([
      CHECKS[1],
    ]);
  });
});
