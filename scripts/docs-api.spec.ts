import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const docs = join(root, 'docs');

/** Documentation pages and examples, excluding dependencies and generated site files. */
function* pages(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.vitepress' || entry.name === 'node_modules') continue;

    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* pages(path);
    else if (/\.(md|ts|vue)$/.test(entry.name)) yield path;
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
const markdown = [...pages(docs)].filter(file => file.endsWith('.md'));

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

  it('provides both languages for every documentation page', () => {
    const missing = markdown
      .filter(
        file => !relative(docs, file).startsWith('zh/') && file !== join(docs, 'CHANGELOG.md'),
      )
      .filter(file => !existsSync(join(docs, 'zh', relative(docs, file))));

    expect(missing.map(file => relative(docs, file))).toEqual([]);
  });

  it('embeds existing complete examples', () => {
    const missing: string[] = [];
    const included = new Set<string>();
    for (const file of markdown) {
      for (const match of readFileSync(file, 'utf8').matchAll(/^<<<\s+([^\s#]+)/gm)) {
        const example = resolve(dirname(file), match[1] as string);
        included.add(example);
        if (!existsSync(example)) missing.push(relative(docs, example));
      }
    }

    expect(missing).toEqual([]);
    expect(included.size).toBeGreaterThanOrEqual(5);
  });

  it('links to existing public source files', () => {
    const missing: string[] = [];
    for (const file of markdown) {
      const links = readFileSync(file, 'utf8').matchAll(
        /https:\/\/github\.com\/realLiangshiwei\/Lsw\.Abp\.VueUI\/blob\/main\/([^\s)#]+)/g,
      );
      for (const link of links) {
        const source = decodeURIComponent(link[1] as string);
        if (!existsSync(join(root, source))) missing.push(`${source} (${relative(docs, file)})`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('lists real runtime exports in each package reference entry', async () => {
    const missing: string[] = [];
    for (const file of markdown.filter(file => relative(docs, file).startsWith('api/'))) {
      const body = readFileSync(file, 'utf8');
      for (const section of body.split(/^## /m)) {
        const packageName = /^`(@lsw-abpvue\/[^`]+)`/.exec(section)?.[1];
        if (!packageName) continue;
        const module = (await import(packageName)) as Record<string, unknown>;
        for (const row of section.matchAll(/^\|\s*`([^`]+)`\s*\|\s*Value\s*\|/gm)) {
          const name = row[1] as string;
          if (!(name in module)) missing.push(`${packageName}.${name}`);
        }
      }
    }
    expect(missing).toEqual([]);
  }, 30_000);
});
