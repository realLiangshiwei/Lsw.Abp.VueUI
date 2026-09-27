import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { generateProxy, readApiDefinition, type ApiDefinition } from '@lsw-abpvue/cli';
import { describe, expect, it } from 'vitest';
import { fixtureSets } from './fixtures.js';

const BACKEND = process.env.ABP_BACKEND_URL ?? 'https://localhost:44384';
const CORE_MODELS = resolve(import.meta.dirname, '../../packages/core/src/proxy/models.ts');

const strictTls = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

/**
 * What to compare against: the live backend when there is one, and every captured
 * version either way. Two rows of the same version are one row -- a live 10.6 backend
 * says the same thing its own capture does.
 */
async function subjects(): Promise<{ version: string; definition: ApiDefinition }[]> {
  const captured = fixtureSets();
  const rows = await Promise.all(
    captured.map(async set => ({
      version: `${set.version} (captured)`,
      definition: await readApiDefinition({ file: set.apiDefinition }),
    })),
  );

  try {
    const live = await readApiDefinition({ url: BACKEND });
    return [{ version: 'the running backend', definition: live }, ...rows];
  } catch {
    console.info(`[core] No ABP backend at ${BACKEND}; comparing against the captures only.`);
    return rows;
  } finally {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = strictTls ?? '1';
  }
}

interface Property {
  optional: boolean;
  type: string;
}

/** The body of a brace that has just been opened, nesting included. */
function bodyAt(source: string, start: number): string {
  let depth = 1;

  for (let index = start; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    else if (source[index] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, index);
    }
  }

  return source.slice(start);
}

/**
 * The interfaces of one TypeScript file, by name, each with its properties. A parser
 * rather than a type-level check because a type cannot be reflected at runtime, and both
 * sides here are files this repository writes.
 */
function interfacesIn(source: string): Map<string, Map<string, Property>> {
  const interfaces = new Map<string, Map<string, Property>>();

  for (const match of source.matchAll(/export interface (\w+)[^{]*\{/g)) {
    const properties = new Map<string, Property>();

    for (const line of bodyAt(source, match.index + match[0].length).split('\n')) {
      const property = /^\s*'?([A-Za-z_][\w]*)'?(\??):\s*(.+);$/.exec(line);
      if (property) {
        properties.set(property[1] as string, {
          optional: property[2] === '?',
          type: (property[3] as string).trim(),
        });
      }
    }

    interfaces.set(match[1] as string, properties);
  }

  return interfaces;
}

function generatedFrom(definition: ApiDefinition): Map<string, Map<string, Property>> {
  return interfacesIn(
    generateProxy({ definition, modules: ['abp'], validators: false, policyNames: false })
      .files.filter(file => file.path.endsWith('models.ts'))
      .map(file => file.content)
      .join('\n'),
  );
}

const handWritten = interfacesIn(await readFile(CORE_MODELS, 'utf8'));
const matrix = await subjects();

/**
 * `core` writes the DTOs of ABP's framework endpoints by hand rather than generating
 * them: it asserts the configuration endpoint answers with every section, and the
 * backend's metadata cannot say so -- ABP's own modules compile without nullable
 * reference types, so every reference property comes back as "not nullable" whether or
 * not it is. Everything below is what that hand-written copy is allowed to differ in.
 */
/**
 * What core declares that the backend does not send, on purpose. Each one is part of
 * ABP's UI model rather than its wire model, and the extension system reads it from
 * contributors rather than from the configuration endpoint.
 */
const DECLARED_ON_PURPOSE: Record<string, string[]> = {
  // Help text under a form field. `isSortable` on `ExtensionPropertyUiDto` is the same
  // case, and is not listed because it sits inside an inline object type.
  ExtensionPropertyDto: ['formText'],
};

describe('the contract matrix', () => {
  it('keeps both tested ABP minors in the captured matrix', () => {
    expect(fixtureSets().map(set => set.version)).toEqual(
      expect.arrayContaining(['10.5.0', '10.6.0']),
    );
  });

  it('has a row per captured ABP version, and one for a live backend', () => {
    for (const set of fixtureSets()) {
      expect(matrix.map(row => row.version)).toContain(`${set.version} (captured)`);
    }
    console.info(`[core] contract matrix: ${matrix.map(row => row.version).join(', ')}`);
  });
});

describe.each(matrix)(
  'the framework DTOs core writes by hand, against $version',
  ({ definition }) => {
    const generated = generatedFrom(definition);
    const shared = [...handWritten.keys()].filter(name => generated.has(name));

    it('covers the same types the generator produces for the abp module', () => {
      expect(shared.length).toBeGreaterThan(30);
    });

    it.each(shared)('%s declares no property the backend does not have', name => {
      const ours = handWritten.get(name) as Map<string, Property>;
      const theirs = generated.get(name) as Map<string, Property>;
      const allowed = DECLARED_ON_PURPOSE[name] ?? [];

      expect(
        [...ours.keys()].filter(property => !theirs.has(property) && !allowed.includes(property)),
      ).toEqual([]);
    });

    it.each(shared)('%s declares every property the backend has', name => {
      const ours = handWritten.get(name) as Map<string, Property>;
      const theirs = generated.get(name) as Map<string, Property>;

      expect([...theirs.keys()].filter(property => !ours.has(property))).toEqual([]);
    });

    it.each(shared)('%s admits null wherever the backend says the value may be null', name => {
      const ours = handWritten.get(name) as Map<string, Property>;
      const theirs = generated.get(name) as Map<string, Property>;

      const missing = [...theirs]
        .filter(([property, { type }]) => {
          const mine = ours.get(property);
          // `unknown` already covers null, and saying `unknown | null` says nothing more.
          return (
            type.includes('| null') &&
            mine !== undefined &&
            !mine.type.includes('| null') &&
            mine.type !== 'unknown'
          );
        })
        .map(([property]) => property);

      expect(missing).toEqual([]);
    });
  },
);
