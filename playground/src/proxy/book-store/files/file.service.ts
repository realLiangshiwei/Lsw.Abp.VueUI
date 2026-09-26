import { defineService, inject, RestService } from '@lsw-abpvue/core';
import type { ListResultDto, RestConfig, ServiceOf } from '@lsw-abpvue/core';
import type { FileDescriptorDto } from './models.js';

export const FileService = defineService('FileService', () => {
  const rest = inject(RestService);
  const apiName = 'Default';

  return {
    apiName,

    getContent: (name: string, config?: RestConfig): Promise<Blob> =>
      rest.request<never, Blob>(
        { method: 'GET', responseType: 'blob', url: '/api/app/file/content', params: { name } },
        { apiName, ...config },
      ),

    getList: (config?: RestConfig): Promise<ListResultDto<FileDescriptorDto>> =>
      rest.request<never, ListResultDto<FileDescriptorDto>>(
        { method: 'GET', url: '/api/app/file' },
        { apiName, ...config },
      ),

    upload: (file: FormData, config?: RestConfig): Promise<FileDescriptorDto> =>
      rest.request<FormData, FileDescriptorDto>(
        { method: 'POST', url: '/api/app/file/upload', body: file },
        { apiName, ...config },
      ),
  };
});
export type FileService = ServiceOf<typeof FileService>;
