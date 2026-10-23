import type {
  EntityActionContributorCallback,
  EntityPropContributorCallback,
  ToolbarActionContributorCallback,
} from '@lsw-abpvue/components';
import type { AuditLogDto, EntityChangeDto } from '@lsw-abpvue/audit-logging/proxy';
import { describe, expectTypeOf, it } from 'vitest';
import type {
  AuditLoggingConfigOptions,
  AuditLogsPageCommands,
  ShowEntityDetails,
} from './index.js';

describe('audit contributor types', () => {
  it('preserves the record type of each Angular component key', () => {
    type Actions = NonNullable<AuditLoggingConfigOptions['entityActionContributors']>;
    type Props = NonNullable<AuditLoggingConfigOptions['entityPropContributors']>;
    type Toolbar = NonNullable<AuditLoggingConfigOptions['toolbarActionContributors']>;
    expectTypeOf<NonNullable<Actions['AuditLogging.AuditLogsComponent']>[number]>().toEqualTypeOf<
      EntityActionContributorCallback<AuditLogDto>
    >();
    expectTypeOf<
      NonNullable<Actions['AuditLogging.EntityChangesComponent']>[number]
    >().toEqualTypeOf<EntityActionContributorCallback<EntityChangeDto>>();
    expectTypeOf<NonNullable<Props['AuditLogging.AuditLogsComponent']>[number]>().toEqualTypeOf<
      EntityPropContributorCallback<AuditLogDto>
    >();
    expectTypeOf<NonNullable<Toolbar['AuditLogging.AuditLogsComponent']>[number]>().toEqualTypeOf<
      ToolbarActionContributorCallback<readonly AuditLogDto[]>
    >();
    expectTypeOf<AuditLogsPageCommands['openModal']>().toEqualTypeOf<(id: string) => void>();
    expectTypeOf<ShowEntityDetails>().toEqualTypeOf<(entityChangeId: string) => void>();
  });
});
