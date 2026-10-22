export type * from './asp-net-core/mvc/application-configurations/models.js';
export type * from './asp-net-core/mvc/application-configurations/object-extending/models.js';
export type * from './asp-net-core/mvc/multi-tenancy/models.js';
export type * from './localization/models.js';

declare module './asp-net-core/mvc/application-configurations/object-extending/models.js' {
  interface ExtensionPropertyDto {
    formText?: string | undefined;
  }
  interface ExtensionPropertyUiTableDto {
    isSortable?: boolean | undefined;
  }
}
