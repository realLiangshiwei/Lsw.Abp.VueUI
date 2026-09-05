import { defineService, inject, SessionStateService, type AbpHttpError } from '@lsw-abpvue/core';
import { DEFAULT_ERROR_MESSAGES } from '../defaults/error-messages.js';
import type { AbpErrorHandler } from '../models/error-handler.js';
import { ToasterService } from '../services/toaster.service.js';

const HEADER = 'Abp-Tenant-Resolve-Error';

/**
 * The request named a tenant the backend will not resolve -- renamed, deleted, or
 * disabled. Carrying on as that tenant would show the user someone else's data, or
 * nothing at all with no explanation, so the tenant is dropped and the application
 * continues as the host.
 */
export const TenantResolveErrorHandler = defineService<AbpErrorHandler>(
  'TenantResolveErrorHandler',
  () => {
    const session = inject(SessionStateService);
    const toaster = inject(ToasterService);

    return {
      priority: 20,

      canHandle: (error: AbpHttpError): boolean => error.headers?.has(HEADER) === true,

      handle: (error: AbpHttpError): void => {
        const tenant = session.getTenant();
        session.setTenant(null);

        // The header carries the backend's own reason when it has one; the key is ABP's
        // own and takes the name of the tenant that could not be resolved.
        toaster.error(
          error.headers?.get(HEADER) || {
            key: 'AbpUiMultiTenancy::GivenTenantIsNotAvailable',
            defaultValue: "Given tenant isn't available: {0}",
          },
          DEFAULT_ERROR_MESSAGES.default.title,
          { messageLocalizationParams: [tenant?.name ?? ''] },
        );
      },
    };
  },
);
