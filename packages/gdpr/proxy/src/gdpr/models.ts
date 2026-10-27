import type { EntityDto, PagedAndSortedResultRequestDto } from '@lsw-abpvue/core';

export interface DownloadTokenResultDto {
  token?: string | undefined;
}

export interface GdprRequestDto extends EntityDto<string> {
  creationTime: string;
  readyTime: string;
}

export interface GdprRequestInput extends PagedAndSortedResultRequestDto {
  userId: string;
}
