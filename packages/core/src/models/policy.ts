/**
 * The permission names a project knows about. Empty here, and a project closes it by
 * merging in the union its generated `*.policy-names.ts` exports, which the generated
 * file's own header spells out.
 *
 * Merging nothing is a supported state: while the interface is empty every string is
 * accepted, so this narrows an existing application only when it asks to be narrowed.
 */
/* eslint-disable-next-line @typescript-eslint/no-empty-object-type --
   The point is that a project fills it in, and only an interface can be merged into. */
export interface AbpKnownPolicyName {}

type KnownPolicyName = keyof AbpKnownPolicyName & string;

/**
 * A policy expression is not narrowed: `'A || B'` is two names and an operator, and the
 * atoms inside it are checked when it runs, not here.
 */
type PolicyExpressionText = `${string}||${string}` | `${string}&&${string}`;

/** What a policy name that no module declares resolves to, so the error says as much. */
export interface UnknownPolicyName<T> {
  readonly __policyNameIsNotDeclaredByAnyModule: T;
}

/**
 * `T` when `T` is a name some module declares, an expression of them, or plain `string`;
 * otherwise a type nothing is assignable to, which turns a mistyped literal into a
 * compile error rather than a permission check that quietly answers no.
 */
export type AbpPolicyName<T extends string> = [KnownPolicyName] extends [never]
  ? T
  : string extends T
    ? T
    : T extends KnownPolicyName | PolicyExpressionText
      ? T
      : UnknownPolicyName<T>;
