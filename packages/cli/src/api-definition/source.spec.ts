import { describe, expect, it } from 'vitest';
import { API_DEFINITION_PATH, ApiDefinitionError, readApiDefinition } from './source.js';

const definition = {
  modules: {
    identity: { rootPath: 'identity', remoteServiceName: 'AbpIdentity', controllers: {} },
  },
  types: { 'Acme.BookDto': { isEnum: false } },
};

function answering(body: unknown, status = 200): typeof globalThis.fetch {
  return (() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
    })) as unknown as typeof globalThis.fetch;
}

describe('reading from a backend', () => {
  it('asks for the types, without which there is nothing to generate', async () => {
    let asked = '';
    const fetch = ((url: string) => {
      asked = url;
      return answering(definition)(url);
    }) as unknown as typeof globalThis.fetch;

    await readApiDefinition({ url: 'https://localhost:44384/', fetch });

    expect(asked).toBe(`https://localhost:44384${API_DEFINITION_PATH}`);
  });

  it('sends the token when there is one', async () => {
    let headers: Record<string, string> = {};
    const fetch = ((url: string, init: { headers: Record<string, string> }) => {
      headers = init.headers;
      return answering(definition)(url);
    }) as unknown as typeof globalThis.fetch;

    await readApiDefinition({ url: 'https://localhost:44384', token: 'abc', fetch });

    expect(headers).toEqual({ Authorization: 'Bearer abc' });
  });

  it('says the endpoint needs a token when it answers 401', async () => {
    await expect(
      readApiDefinition({ url: 'https://x', fetch: answering({}, 401) }),
    ).rejects.toThrow(/--token/);
  });

  it('says what a 404 means', async () => {
    await expect(
      readApiDefinition({ url: 'https://x', fetch: answering({}, 404) }),
    ).rejects.toThrow(/404/);
  });

  it('says so when the type pool came back empty', async () => {
    await expect(
      readApiDefinition({ url: 'https://x', fetch: answering({ modules: definition.modules }) }),
    ).rejects.toThrow(/includeTypes=true/);
  });

  it('says so when the backend is not reachable', async () => {
    const fetch = (() => Promise.reject(new Error('ECONNREFUSED'))) as typeof globalThis.fetch;

    await expect(readApiDefinition({ url: 'https://x', fetch })).rejects.toBeInstanceOf(
      ApiDefinitionError,
    );
  });

  it('needs somewhere to read from', async () => {
    await expect(readApiDefinition({})).rejects.toThrow(/--url/);
  });
});

describe('reading from a file', () => {
  it('says which file could not be read', async () => {
    await expect(readApiDefinition({ file: '/nowhere/api-definition.json' })).rejects.toThrow(
      /\/nowhere\/api-definition.json/,
    );
  });
});
