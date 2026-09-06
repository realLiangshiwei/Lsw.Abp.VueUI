import { AbpPagination } from '@lsw-abpvue/theme-shared';
import { describe, expect, it } from 'vitest';
import { findAllRendered, findRendered, renderContract, type ThemeUnderTest } from '../harness.js';

export function testPagination(theme: ThemeUnderTest): void {
  const paged = (props: Record<string, unknown> = {}) =>
    renderContract(theme, AbpPagination, {
      props: { page: 0, pageSize: 10, total: 35, ...props },
      events: ['update:page', 'update:pageSize'],
    });

  describe('AbpPagination', () => {
    it('is a navigation landmark with a name', () => {
      const rendered = paged({ ariaLabel: 'Books pages' });
      const nav = findRendered(rendered, 'nav');

      expect(nav).not.toBeNull();
      expect(nav?.attributes('aria-label')).toBe('Books pages');
    });

    it('marks the page the user is on', () => {
      const rendered = paged({ page: 1 });
      const current = findRendered(rendered, '[aria-current="page"]');

      expect(current).not.toBeNull();
      expect(current?.text()).toContain('2');
    });

    it('reports the page it was asked to go to, counting from zero', async () => {
      const rendered = paged();
      const third = findAllRendered(rendered, '[aria-current], button, a').find(
        item => item.text() === '3',
      );

      await third?.trigger('click');

      expect(rendered.emitted('update:page').at(-1)).toEqual([2]);
    });

    it('can reach the first page and the last', () => {
      const rendered = paged({ page: 0, total: 350, pageSize: 10 });
      const pages = findAllRendered(rendered, 'nav button, nav a').filter(item =>
        /^\d+$/.test(item.text()),
      );

      // What sits between them is the theme's business -- how many siblings, where the
      // ellipsis goes -- but a pager that cannot reach the end is not a pager.
      expect(pages.at(0)?.text()).toBe('1');
      expect(pages.at(-1)?.text()).toBe('35');
    });

    it('reports a change of page size', async () => {
      const rendered = paged({ showSizeSelector: true, pageSizes: [10, 25] });

      await findRendered(rendered, 'select')?.setValue('25');

      expect(rendered.emitted('update:pageSize').at(-1)).toEqual([25]);
    });

    it('cannot be used when disabled', async () => {
      const rendered = paged({ disabled: true });
      const second = findAllRendered(rendered, 'nav button, nav a').find(
        item => item.text() === '2',
      );

      await second?.trigger('click');

      expect(rendered.emitted('update:page')).toHaveLength(0);
    });
  });
}
