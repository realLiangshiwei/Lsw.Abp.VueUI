import { defineService, type PagedResultDto, type PageQueryParams } from '@lsw-abpvue/core';

export interface DemoUserDto {
  id: string;
  userName: string;
  email: string;
  isActive: boolean;
  extraProperties: Record<string, unknown>;
}

const SEED: DemoUserDto[] = [
  {
    id: '1',
    userName: 'admin',
    email: 'admin@abp.io',
    isActive: true,
    extraProperties: { SocialSecurityNumber: '111-22-3333', Age: 42, Title: 1 },
  },
  {
    id: '2',
    userName: 'john.nash',
    email: 'john@abp.io',
    isActive: true,
    extraProperties: { SocialSecurityNumber: '222-33-4444', Age: 35, Title: 0 },
  },
  {
    id: '3',
    userName: 'alice.doe',
    email: 'alice@abp.io',
    isActive: false,
    extraProperties: { SocialSecurityNumber: '333-44-5555', Age: 29, Title: 2 },
  },
];

/**
 * Stands in for `@lsw-abpvue/identity` until M6 ships it. In memory on purpose: this
 * page is here to show the extension system, and a page that needs a backend to render
 * would show it only when one is running.
 */
export const DemoUsersService = defineService('DemoUsersService', () => {
  let users = SEED.map(user => ({ ...user }));

  return {
    getList: (query: PageQueryParams): Promise<PagedResultDto<DemoUserDto>> => {
      const filtered = query.filter
        ? users.filter(user => user.userName.includes(query.filter ?? ''))
        : users;

      const [key = '', order = 'asc'] = (query.sorting ?? '').split(' ');
      const sorted = key
        ? [...filtered].sort((left, right) => {
            const compared = String(left[key as keyof DemoUserDto] ?? '').localeCompare(
              String(right[key as keyof DemoUserDto] ?? ''),
            );
            return order === 'desc' ? -compared : compared;
          })
        : filtered;

      const skip = query.skipCount ?? 0;
      return Promise.resolve({
        items: sorted.slice(skip, skip + (query.maxResultCount ?? 10)),
        totalCount: sorted.length,
      });
    },

    save: (user: Partial<DemoUserDto> & { id?: string | undefined }): Promise<void> => {
      if (user.id) {
        users = users.map(existing =>
          existing.id === user.id ? { ...existing, ...user } : existing,
        );
      } else {
        users = [
          ...users,
          {
            extraProperties: {},
            isActive: true,
            email: '',
            userName: '',
            ...user,
            id: String(users.length + 1),
          },
        ];
      }

      return Promise.resolve();
    },

    delete: (id: string): Promise<void> => {
      users = users.filter(user => user.id !== id);
      return Promise.resolve();
    },
  };
});
