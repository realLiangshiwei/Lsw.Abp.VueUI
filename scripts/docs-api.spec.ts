import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const docs = join(root, 'docs');

/** Every `.md` under `docs`, except what VitePress builds. */
function* pages(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.vitepress' || entry.name === 'node_modules') continue;

    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* pages(path);
    else if (entry.name.endsWith('.md')) yield path;
  }
}

interface Usage {
  package: string;
  names: string[];
  file: string;
}

const IMPORT = /^import\s+(type\s+)?\{([^}]+)\}\s+from\s+'(@lsw-abpvue\/[^']+)';?$/gm;

/**
 * The value imports a page's examples make from this project's packages. Type-only
 * imports are left out: they are gone at runtime, and this checks against what a package
 * actually exports.
 */
function usagesIn(file: string): Usage[] {
  const body = readFileSync(file, 'utf8');

  return [...body.matchAll(IMPORT)]
    .filter(match => !match[1])
    .map(match => ({
      package: match[3] as string,
      names: (match[2] as string)
        .split(',')
        .map(
          name =>
            name
              .trim()
              .split(/\s+as\s+/)[0]
              ?.trim() ?? '',
        )
        // A `type X` inside a value import is still a type.
        .filter(name => name && !name.startsWith('type ')),
      file: relative(root, file),
    }));
}

const usages = [...pages(docs)].flatMap(usagesIn);

describe('the documentation site', () => {
  it('has examples to check', () => {
    expect(usages.length).toBeGreaterThan(5);
  });

  it('imports only what the packages export', async () => {
    const missing: string[] = [];

    for (const usage of usages) {
      const module = (await import(usage.package)) as Record<string, unknown>;

      for (const name of usage.names) {
        if (!(name in module)) missing.push(`${usage.package}.${name} (${usage.file})`);
      }
    }

    // A documented API that is not exported is a promise the code does not keep, and
    // the design documents call the docs a contract.
    expect([...new Set(missing)]).toEqual([]);
  }, 20_000);
});
