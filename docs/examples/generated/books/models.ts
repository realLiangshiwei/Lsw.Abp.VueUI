import type {
  ExtensibleAuditedEntityDto,
  ExtensibleObject,
  PagedAndSortedResultRequestDto,
} from '@lsw-abpvue/core';
import type { BookType } from './book-type.enum.js';

export interface BookDto extends ExtensibleAuditedEntityDto<string> {
  name?: string | undefined;
  type: BookType;
  publishDate: string;
  price: number;
}

export interface CreateUpdateBookDto extends ExtensibleObject {
  name: string;
  type: BookType;
  publishDate: string;
  price: number;
}

export interface GetBookListInput extends PagedAndSortedResultRequestDto {
  filter?: string | null | undefined;
}
