import { describe, expect, it } from 'vitest';
import { reachBackend } from './backend.js';

describe('reachBackend', () => {
  it('says where it tried and why it did not get an answer', async () => {
    // Port 1 is reserved and nothing listens on it, so this fails the way a backend that
    // has not been started does.
    const result = await reachBackend('http://127.0.0.1:1', 2000);

    expect(result.reachable).toBe(false);
    expect(result.detail).toContain('http://127.0.0.1:1');
  });
});
