import { describe, expect, it } from 'vitest';
import { Rollback } from './rollback.js';

describe('Rollback', () => {
  it('takes back what was done, newest first', async () => {
    const rollback = new Rollback();
    const order: string[] = [];

    rollback.add('made the directory', async () => void order.push('directory'));
    rollback.add('wrote the files', async () => void order.push('files'));

    expect(await rollback.run()).toEqual(['wrote the files', 'made the directory']);
    expect(order).toEqual(['files', 'directory']);
  });

  it('carries on when one of the undos fails', async () => {
    const rollback = new Rollback();

    rollback.add('made the directory', async () => undefined);
    rollback.add('wrote the files', () => Promise.reject(new Error('gone')));

    expect(await rollback.run()).toEqual(['made the directory']);
  });

  it('has nothing to take back once the command has finished', async () => {
    const rollback = new Rollback();
    rollback.add('made the directory', () => Promise.reject(new Error('should not run')));

    rollback.commit();

    expect(await rollback.run()).toEqual([]);
  });
});
