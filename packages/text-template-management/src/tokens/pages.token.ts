import { defineToken } from '@lsw-abpvue/core';
import type { TemplateDefinitionDto } from '@lsw-abpvue/text-template-management/proxy';

/** Commands available to text template row and toolbar contributions. */
export interface TextTemplatesPageCommands {
  editContents(record: TemplateDefinitionDto): void;
}

export const TEXT_TEMPLATES_PAGE = defineToken<TextTemplatesPageCommands>('TEXT_TEMPLATES_PAGE');
