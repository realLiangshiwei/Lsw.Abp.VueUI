import { defineService, inject, RestService } from '@lsw-abpvue/core';
import type { PagedResultDto, RestConfig, ServiceOf } from '@lsw-abpvue/core';
import type { BookDto, CreateUpdateBookDto, GetBookListInput } from './models.js';

export const BookService = defineService('BookService', () => {
  const rest = inject(RestService);
  const apiName = 'Default';

  return {
    apiName,

    create: (input: CreateUpdateBookDto, config?: RestConfig): Promise<BookDto> =>
      rest.request<CreateUpdateBookDto, BookDto>(
        { method: 'POST', url: '/api/app/book', body: input },
        { apiName, ...config },
      ),

    delete: (id: string, config?: RestConfig): Promise<void> =>
      rest.request<never, void>(
        { method: 'DELETE', url: `/api/app/book/${id}` },
        { apiName, ...config },
      ),

    get: (id: string, config?: RestConfig): Promise<BookDto> =>
      rest.request<never, BookDto>(
        { method: 'GET', url: `/api/app/book/${id}` },
        { apiName, ...config },
      ),

    getList: (input: GetBookListInput, config?: RestConfig): Promise<PagedResultDto<BookDto>> =>
      rest.request<never, PagedResultDto<BookDto>>(
        {
          method: 'GET',
          url: '/api/app/book',
          params: {
            filter: input.filter,
            sorting: input.sorting,
            skipCount: input.skipCount,
            maxResultCount: input.maxResultCount,
          },
        },
        { apiName, ...config },
      ),

    update: (id: string, input: CreateUpdateBookDto, config?: RestConfig): Promise<BookDto> =>
      rest.request<CreateUpdateBookDto, BookDto>(
        { method: 'PUT', url: `/api/app/book/${id}`, body: input },
        { apiName, ...config },
      ),
  };
});
export type BookService = ServiceOf<typeof BookService>;
