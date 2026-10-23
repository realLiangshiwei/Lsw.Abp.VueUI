import { AuditLoggingPolicyNames, AuditLoggingRouteNames } from '@lsw-abpvue/audit-logging/config';
import {
  AbpReplaceableRouteContainer,
  AbpRouterOutlet,
  withResolvers,
} from '@lsw-abpvue/core/router';
import type { RouteRecordRaw } from 'vue-router';
import AuditLogsPage from './components/AuditLogsPage.vue';
import { AuditLoggingComponents } from './enums/components.js';
import { auditLoggingGuard } from './guards/audit-logging.guard.js';
import { provideAuditLogging } from './providers/audit-logging.provider.js';
import { auditLoggingExtensionsResolver } from './resolvers/extensions.resolver.js';
import type { AuditLoggingConfigOptions } from './tokens/extensions.token.js';

/** Creates audit routes with application contributions and component replacement. */
export function createAuditLoggingRoutes(
  options: AuditLoggingConfigOptions = {},
): RouteRecordRaw[] {
  return [
    {
      path: '/audit-logs',
      component: AbpRouterOutlet,
      beforeEnter: [auditLoggingGuard, withResolvers([auditLoggingExtensionsResolver])],
      meta: {
        providers: provideAuditLogging(options),
        requiresAuthentication: true,
        requiredPolicy: AuditLoggingPolicyNames.AuditLogging,
      },
      children: [
        {
          path: '',
          component: AbpReplaceableRouteContainer,
          meta: {
            title: AuditLoggingRouteNames.AuditLogging,
            replaceableComponent: {
              key: AuditLoggingComponents.AuditLogs,
              defaultComponent: AuditLogsPage,
            },
          },
        },
      ],
    },
  ];
}
