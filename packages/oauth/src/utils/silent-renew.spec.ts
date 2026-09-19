// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest';
import { completeSilentRenew } from './silent-renew.js';

describe('completeSilentRenew', () => {
  it('hands the callback URL to the window that opened the iframe', async () => {
    const url = `${window.location.origin}/silent-renew.html?code=abc&state=xyz`;
    window.history.replaceState({}, '', url);

    const message = new Promise<MessageEvent>(resolve =>
      window.addEventListener('message', resolve as EventListener, { once: true }),
    );

    await completeSilentRenew();

    // The shape is the library's own: it is what its iframe navigator listens for.
    expect((await message).data).toEqual({ source: 'oidc-client', url, keepOpen: false });
  });
});
