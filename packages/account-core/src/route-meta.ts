// The empty import is what brings `vue-router` into scope for the augmentation; there is
// nothing to name from it.
import type {} from 'vue-router';

declare module 'vue-router' {
  interface RouteMeta {
    /**
     * Whether the account layout offers to switch tenant on this page. False on the one
     * page where switching would be wrong: a password reset link is issued by a tenant.
     */
    tenantBoxVisible?: boolean;
  }
}

export {};
