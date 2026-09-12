import { isDevMode } from '@lsw-abpvue/utils';
import { computed, toValue, type ComputedRef, type MaybeRefOrGetter } from 'vue';
import { inject } from '../di/inject.js';
import { defineService, type ServiceOf } from '../di/token.js';
import type { AbpPolicyName } from '../models/policy.js';
import { evaluatePolicy, parsePolicy, type PolicyExpression } from '../utils/policy-expression.js';
import { ConfigStateService } from './config-state.service.js';

export const PermissionService = defineService('PermissionService', () => {
  const configState = inject(ConfigStateService);
  const granted = configState.getDeep<Record<string, boolean>>('auth.grantedPolicies');
  // Policy strings come from route data and menu items, so the same handful is asked
  // about on every navigation; parsing them once is the difference the style guide asks for.
  const parsed = new Map<string, PolicyExpression | null>();

  function expressionFor(policy: string): PolicyExpression | null {
    if (!parsed.has(policy)) {
      const expression = parsePolicy(policy);
      if (!expression && isDevMode()) {
        console.warn(`[abp] Could not parse the policy expression "${policy}".`);
      }
      parsed.set(policy, expression);
    }

    return parsed.get(policy) ?? null;
  }

  /**
   * Whether a policy holds. Accepts a single permission name or an expression of them:
   * `A || B`, `A && B`, and unlike Angular the two mixed with parentheses.
   * @param policy Policy expression; an empty one is granted, as in Angular
   */
  function isGranted<T extends string>(policy: (T & AbpPolicyName<T>) | undefined): boolean {
    if (!policy) return true;

    const expression = expressionFor(policy);
    if (!expression) return false;

    return evaluatePolicy(expression, name => granted.value?.[name] === true);
  }

  return {
    isGranted,

    isGrantedRef: <T extends string>(
      policy: MaybeRefOrGetter<(T & AbpPolicyName<T>) | undefined>,
    ): ComputedRef<boolean> => computed(() => isGranted(toValue(policy))),

    filterByPolicy: <T extends { requiredPolicy?: string | undefined }>(items: readonly T[]): T[] =>
      items.filter(item => isGranted(item.requiredPolicy)),
  };
});
export type PermissionService = ServiceOf<typeof PermissionService>;

export const usePermission = (): PermissionService => inject(PermissionService);
