import { AbpPagination } from '@lsw-abpvue/theme-shared';
import { describe, expect, it } from 'vitest';
import { renderContract, type ThemeUnderTest } from '../harness.js';

export function testPagination(theme: ThemeUnderTest): void {
  const paged = (props: Record<string, unknown> = {}) =>
    renderContract(theme, AbpPagination, {
      props: { page: 0, pageSize: 10, total: 35, ...props },
      events: ['update:page', 'update:pageSize'],
    });

  describe('AbpPagination', () => {
    it('is a navigation landmark with a name', () => {
      const { wrapper } = paged({ ariaLabel: 'Books pages' });
      const nav = wrapper.find('nav');

      expect(nav.exists()).toBe(true);
      expect(nav.attributes('aria-label')).toBe('Books pages');
    });

    it('marks the page the user is on', () => {
      const { wrapper } = paged({ page: 1 });
      const current = wrapper.find('[aria-current="page"]');

      expect(current.exists()).toBe(true);
      expect(current.text()).toContain('2');
    });

    it('reports the page it was asked to go to, counting from zero', async () => {
      const { wrapper, emitted } = paged();
      const third = wrapper.findAll('[aria-current], button, a').find(item => item.text() === '3');

      await third?.trigger('click');

      expect(emitted('update:page').at(-1)).toEqual([2]);
    });

    it('can reach the first page and the last', () => {
      const { wrapper } = paged({ page: 0, total: 350, pageSize: 10 });
      const pages = wrapper.findAll('nav button, nav a').filter(item => /^\d+$/.test(item.text()));

      // What sits between them is the theme's business -- how many siblings, where the
      // ellipsis goes -- but a pager that cannot reach the end is not a pager.
      expect(pages.at(0)?.text()).toBe('1');
      expect(pages.at(-1)?.text()).toBe('35');
    });

    it('reports a change of page size', async () => {
      const { wrapper, emitted } = paged({ showSizeSelector: true, pageSizes: [10, 25] });

      await wrapper.find('select').setValue('25');

      expect(emitted('update:pageSize').at(-1)).toEqual([25]);
    });

    it('cannot be used when disabled', async () => {
      const { wrapper, emitted } = paged({ disabled: true });
      const second = wrapper.findAll('nav button, nav a').find(item => item.text() === '2');

      await second?.trigger('click');

      expect(emitted('update:page')).toHaveLength(0);
    });
  });
}
