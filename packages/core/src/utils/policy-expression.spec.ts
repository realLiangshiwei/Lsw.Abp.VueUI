import { describe, expect, it } from 'vitest';
import { evaluatePolicy, parsePolicy } from './policy-expression.js';

const granted = new Set(['A', 'B']);
const evaluate = (policy: string) => {
  const expression = parsePolicy(policy);
  return expression ? evaluatePolicy(expression, name => granted.has(name)) : null;
};

describe('policy expressions', () => {
  it.each([
    ['A', true],
    ['C', false],
    ['A || C', true],
    ['C || D', false],
    ['A && B', true],
    ['A && C', false],
    ['Abp.Identity.Users.Create', false],
  ])('%s → %s', (policy, expected) => {
    expect(evaluate(policy)).toBe(expected);
  });

  it.each([
    ['A || C && D', true],
    ['C && D || A', true],
    ['A && C || D', false],
    ['(A || C) && B', true],
    ['(C || D) && A', false],
    ['((A))', true],
    ['A && (B || C)', true],
  ])('mixing and parentheses: %s to %s', (policy, expected) => {
    expect(evaluate(policy)).toBe(expected);
  });

  it('&& binds tighter than ||', () => {
    // 'C && D || A' is only true when && binds first.
    expect(evaluate('C && D || A')).toBe(true);
  });

  it.each(['A &&', '&& A', '(A', 'A)', 'A & B', 'A | B', '()', '', '   '])(
    'reports %s as unparseable rather than throwing',
    policy => {
      expect(parsePolicy(policy)).toBeNull();
    },
  );

  it('dots and hyphens in a permission name are ordinary', () => {
    expect(parsePolicy('AbpIdentity.Users.Create || Abp-Tenant_Management')).not.toBeNull();
  });
});
