import type { AbpPolicyName } from '@lsw-abpvue/core';
import type { AbpIdentityPolicyName } from './proxy/policy-names.js';

/**
 * What a generated `policy-names.ts` is for: merging the union into core closes the set
 * of names `isGranted` will accept, so a misspelled permission stops compiling instead of
 * quietly answering no. An application that skips this keeps working exactly as before.
 */
declare module '@lsw-abpvue/core' {
  interface AbpKnownPolicyName extends Record<AbpIdentityPolicyName, true> {}
}

type Assert<T extends true> = T;

/** A name the backend declares is still accepted... */
export type DeclaredNameIsAccepted = Assert<
  'AbpIdentity.Users' extends AbpPolicyName<'AbpIdentity.Users'> ? true : false
>;

/** ...and one it does not declare is not. */
export type MisspelledNameIsRejected = Assert<
  'AbpIdentity.Userz' extends AbpPolicyName<'AbpIdentity.Userz'> ? false : true
>;

/** A policy read at runtime is not a literal, and still goes through. */
export type RuntimePolicyStillPasses = Assert<string extends AbpPolicyName<string> ? true : false>;
