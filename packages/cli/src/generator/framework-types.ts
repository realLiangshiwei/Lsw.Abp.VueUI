/**
 * The DTO base types `@lsw-abpvue/core` already declares. A generated proxy imports
 * these instead of emitting its own copy, which is what keeps every module's entity
 * assignable to the one `ExtensibleEntityDto` the extension system reads.
 *
 * Keyed by CLR name without generic arity. A type in the same namespace that is not
 * listed here is generated normally, so a backend on a newer ABP is never blocked by
 * this list being short -- it only loses the sharing.
 */
export const FRAMEWORK_TYPES = new Map<string, string>([
  ['Volo.Abp.Application.Dtos.AuditedEntityDto', 'AuditedEntityDto'],
  ['Volo.Abp.Application.Dtos.CreationAuditedEntityDto', 'CreationAuditedEntityDto'],
  ['Volo.Abp.Application.Dtos.EntityDto', 'EntityDto'],
  ['Volo.Abp.Application.Dtos.ExtensibleAuditedEntityDto', 'ExtensibleAuditedEntityDto'],
  [
    'Volo.Abp.Application.Dtos.ExtensibleCreationAuditedEntityDto',
    'ExtensibleCreationAuditedEntityDto',
  ],
  ['Volo.Abp.Application.Dtos.ExtensibleEntityDto', 'ExtensibleEntityDto'],
  ['Volo.Abp.Application.Dtos.ExtensibleFullAuditedEntityDto', 'ExtensibleFullAuditedEntityDto'],
  [
    'Volo.Abp.Application.Dtos.ExtensibleLimitedResultRequestDto',
    'ExtensibleLimitedResultRequestDto',
  ],
  [
    'Volo.Abp.Application.Dtos.ExtensiblePagedAndSortedResultRequestDto',
    'ExtensiblePagedAndSortedResultRequestDto',
  ],
  ['Volo.Abp.Application.Dtos.ExtensiblePagedResultRequestDto', 'ExtensiblePagedResultRequestDto'],
  ['Volo.Abp.Application.Dtos.FullAuditedEntityDto', 'FullAuditedEntityDto'],
  ['Volo.Abp.Application.Dtos.LimitedResultRequestDto', 'LimitedResultRequestDto'],
  ['Volo.Abp.Application.Dtos.ListResultDto', 'ListResultDto'],
  ['Volo.Abp.Application.Dtos.PagedAndSortedResultRequestDto', 'PagedAndSortedResultRequestDto'],
  ['Volo.Abp.Application.Dtos.PagedResultDto', 'PagedResultDto'],
  ['Volo.Abp.Application.Dtos.PagedResultRequestDto', 'PagedResultRequestDto'],
  ['Volo.Abp.NameValue', 'NameValue'],
  ['Volo.Abp.ObjectExtending.ExtensibleObject', 'ExtensibleObject'],
]);

/** The package the framework types come from. */
export const CORE_PACKAGE = '@lsw-abpvue/core';

/**
 * What ABP's `TypeHelper.GetSimplifiedName` maps a BCL type to. Needed because
 * `typeSimple` leaves a type alone once it has met it before in the same tree, so a
 * nested dictionary arrives spelled out.
 */
export const SYSTEM_TYPES = new Map<string, string>([
  ['System.Boolean', 'boolean'],
  ['System.Byte', 'number'],
  ['System.Char', 'string'],
  ['System.DateOnly', 'string'],
  ['System.DateTime', 'string'],
  ['System.DateTimeOffset', 'string'],
  ['System.Decimal', 'number'],
  ['System.Double', 'number'],
  ['System.Guid', 'string'],
  ['System.Int16', 'number'],
  ['System.Int32', 'number'],
  ['System.Int64', 'number'],
  ['System.IntPtr', 'number'],
  ['System.Net.HttpStatusCode', 'number'],
  ['System.Object', 'unknown'],
  ['System.SByte', 'number'],
  ['System.Single', 'number'],
  ['System.String', 'string'],
  ['System.TimeOnly', 'string'],
  ['System.TimeSpan', 'string'],
  ['System.UInt16', 'number'],
  ['System.UInt32', 'number'],
  ['System.UInt64', 'number'],
  ['System.UIntPtr', 'number'],
  ['System.Void', 'void'],
]);

/** What ABP already simplified, which arrives as a lower-case word. */
export const SIMPLE_TYPES = new Map<string, string>([
  ['string', 'string'],
  ['number', 'number'],
  ['boolean', 'boolean'],
  ['void', 'void'],
  // `object` is `System.Object` and `dynamic`: nothing is known about it, and `unknown`
  // makes the caller say what it thinks it is instead of letting `any` through.
  ['object', 'unknown'],
]);

const COLLECTIONS = new Set([
  'System.Collections.Generic.List',
  'System.Collections.Generic.IList',
  'System.Collections.Generic.IEnumerable',
  'System.Collections.Generic.ICollection',
  'System.Collections.Generic.IReadOnlyList',
  'System.Collections.Generic.IReadOnlyCollection',
  'System.Collections.Generic.HashSet',
  'System.Collections.Generic.ISet',
]);

const DICTIONARIES = new Set([
  'System.Collections.Generic.Dictionary',
  'System.Collections.Generic.IDictionary',
  'System.Collections.Generic.IReadOnlyDictionary',
  'System.Collections.Generic.SortedDictionary',
]);

export function isCollectionType(name: string): boolean {
  return COLLECTIONS.has(name);
}

export function isDictionaryType(name: string): boolean {
  return DICTIONARIES.has(name);
}

/** What ABP sends a file as, in both directions. */
export const REMOTE_STREAM_TYPES = new Set([
  'Volo.Abp.Content.IRemoteStreamContent',
  'Volo.Abp.Content.RemoteStreamContent',
]);
