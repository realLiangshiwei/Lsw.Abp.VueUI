export interface SaasEventContext {
  readonly userId: string | null;
  readonly tenantId: string | null;
}

export interface SaasTenantsChanged {
  readonly context: SaasEventContext;
  readonly reason: 'created' | 'updated' | 'deleted' | 'editionChanged';
  readonly tenantIds?: readonly string[] | undefined;
}

export interface SaasEditionsChanged {
  readonly context: SaasEventContext;
  readonly reason: 'created' | 'updated' | 'deleted';
  readonly editionId?: string | undefined;
}
