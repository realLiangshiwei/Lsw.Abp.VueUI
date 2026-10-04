import type { RouteRecordRaw } from 'vue-router';
import { lazyRoutes } from '@lsw-abpvue/core/router';
import { identityOptions } from './users-extension';

export const routes: RouteRecordRaw[] = [
  { path: '/', component: () => import('./FormExample.vue') },
  lazyRoutes('/identity', () =>
    import('@lsw-abpvue/identity').then(module => module.createIdentityRoutes(identityOptions)),
  ),
];
