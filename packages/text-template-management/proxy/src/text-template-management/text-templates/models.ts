import type { PagedAndSortedResultRequestDto } from '@lsw-abpvue/core';

export interface GetTemplateContentInput {
  templateName: string;
  cultureName?: string | undefined;
}

export interface GetTemplateDefinitionListInput extends PagedAndSortedResultRequestDto {
  filterText?: string | undefined;
}

export interface RestoreTemplateContentInput {
  templateName: string;
  cultureName?: string | undefined;
}

export interface TemplateDefinitionDto {
  name?: string | undefined;
  displayName?: string | undefined;
  isLayout: boolean;
  layout?: string | undefined;
  isInlineLocalized: boolean;
  defaultCultureName?: string | undefined;
  renderEngine?: string | undefined;
  isNotSandboxedEngine: boolean;
}

export interface TextTemplateContentDto {
  name?: string | undefined;
  cultureName?: string | undefined;
  content?: string | undefined;
}

export interface UpdateTemplateContentInput {
  templateName: string;
  cultureName?: string | undefined;
  content?: string | undefined;
}
