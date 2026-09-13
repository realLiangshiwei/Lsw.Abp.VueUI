/**
 * The DTO base types ABP's application layer builds on. Generated proxies import them
 * from here instead of emitting a copy per module, which is what keeps `IdentityUserDto`
 * and `TenantDto` assignable to the same `ExtensibleEntityDto` the extension system
 * reads `extraProperties` from.
 *
 * Dates arrive as ISO strings: ABP describes every `DateTime` as `string` in
 * `api-definition`, and nothing here parses them.
 */

/** Carries the values of the object extension properties the backend declares. */
export interface ExtensibleObject {
  extraProperties?: Record<string, unknown> | undefined;
}

export interface EntityDto<TKey = string> {
  id?: TKey | undefined;
}

export interface CreationAuditedEntityDto<TKey = string> extends EntityDto<TKey> {
  creationTime?: string | undefined;
  creatorId?: string | undefined;
}

export interface AuditedEntityDto<TKey = string> extends CreationAuditedEntityDto<TKey> {
  lastModificationTime?: string | undefined;
  lastModifierId?: string | undefined;
}

export interface FullAuditedEntityDto<TKey = string> extends AuditedEntityDto<TKey> {
  isDeleted?: boolean | undefined;
  deleterId?: string | undefined;
  deletionTime?: string | undefined;
}

export interface ExtensibleEntityDto<TKey = string> extends ExtensibleObject {
  id?: TKey | undefined;
}

export interface ExtensibleCreationAuditedEntityDto<
  TKey = string,
> extends ExtensibleEntityDto<TKey> {
  creationTime?: string | undefined;
  creatorId?: string | undefined;
}

export interface ExtensibleAuditedEntityDto<
  TKey = string,
> extends ExtensibleCreationAuditedEntityDto<TKey> {
  lastModificationTime?: string | undefined;
  lastModifierId?: string | undefined;
}

export interface ExtensibleFullAuditedEntityDto<
  TKey = string,
> extends ExtensibleAuditedEntityDto<TKey> {
  isDeleted?: boolean | undefined;
  deleterId?: string | undefined;
  deletionTime?: string | undefined;
}

export interface LimitedResultRequestDto {
  maxResultCount?: number | undefined;
}

export interface PagedResultRequestDto extends LimitedResultRequestDto {
  skipCount?: number | undefined;
}

export interface PagedAndSortedResultRequestDto extends PagedResultRequestDto {
  sorting?: string | undefined;
}

/**
 * `ExtensibleLimitedResultRequestDto` derives from `ExtensibleEntityDto` on the server,
 * which would give every list query an `id` it has no use for. Angular drops that link
 * and so does this.
 */
export interface ExtensibleLimitedResultRequestDto extends ExtensibleObject {
  maxResultCount?: number | undefined;
}

export interface ExtensiblePagedResultRequestDto extends ExtensibleLimitedResultRequestDto {
  skipCount?: number | undefined;
}

export interface ExtensiblePagedAndSortedResultRequestDto extends ExtensiblePagedResultRequestDto {
  sorting?: string | undefined;
}
