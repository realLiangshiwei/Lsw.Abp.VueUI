import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createFrameworkSidebar } from '../docs/.vitepress/sidebar';

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
const englishPages = markdown.filter(
  file => !relative(docs, file).startsWith('zh/') && file !== join(docs, 'CHANGELOG.md'),
);
const FENCE = /^(```|~~~)[^\n]*\n[\s\S]*?^\1[ \t]*$/gm;

function codeBlocks(body: string): string[] {
  return [...body.matchAll(FENCE)].map(match => match[0]);
}

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

  it('keeps authored component guides separate from generated contracts', () => {
    const componentPages = markdown.filter(
      file => /\/components\/[^/]+\.md$/.test(file) && !file.endsWith('/index.md'),
    );
    expect(componentPages).toHaveLength(40);
    for (const file of componentPages) {
      const body = readFileSync(file, 'utf8');
      const authored = body.split('<!-- component-contract:start -->')[0] ?? '';
      expect(authored, relative(docs, file)).toContain('<<< ');
      expect(body, relative(docs, file)).toContain('<!-- component-contract:end -->');
      expect(authored, relative(docs, file)).toMatch(/^## /m);
    }
  });

  it('uses the same included examples in both languages', () => {
    const includes = (file: string): string[] =>
      [...readFileSync(file, 'utf8').matchAll(/^<<<\s+([^\s#]+)/gm)].map(match =>
        resolve(dirname(file), match[1] as string),
      );
    for (const file of markdown.filter(
      file => !relative(docs, file).startsWith('zh/') && file !== join(docs, 'CHANGELOG.md'),
    )) {
      expect(includes(join(docs, 'zh', relative(docs, file))), relative(docs, file)).toEqual(
        includes(file),
      );
    }
  });

  it('keeps translated sections and inline examples aligned with English', () => {
    for (const file of englishPages) {
      const english = readFileSync(file, 'utf8');
      const chinese = readFileSync(join(docs, 'zh', relative(docs, file)), 'utf8');
      const headings = (body: string): number[] =>
        [...body.replace(FENCE, '').matchAll(/^(#{1,6}) /gm)].map(
          match => (match[1] as string).length,
        );
      expect(headings(chinese), relative(docs, file)).toEqual(headings(english));
      expect(codeBlocks(chinese), relative(docs, file)).toEqual(codeBlocks(english));
    }
  });

  it('groups related guides without nesting every topic', () => {
    const english = createFrameworkSidebar('en');
    const chinese = createFrameworkSidebar('zh');
    const links = (items: ReturnType<typeof createFrameworkSidebar>): string[] =>
      items.flatMap(item => (item.link ? [item.link] : links(item.items ?? [])));
    const nested = english.flatMap(item => item.items?.filter(child => child.items) ?? []);
    expect(nested.map(item => item.text)).toEqual(['HTTP requests', 'Theming', 'Page extensions']);
    expect(nested.every(item => item.items?.every(child => !child.items))).toBe(true);
    const paths = links(english);
    expect(new Set(paths).size).toBe(paths.length);
    expect(links(chinese).map(path => path.replace(/^\/zh\//, '/'))).toEqual(paths);
    for (const path of paths) {
      const file = path.endsWith('/') ? `${path}index` : path;
      expect(existsSync(join(docs, `${file}.md`)), path).toBe(true);
    }
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

  it('keeps usage guides linked without a generated export section', () => {
    const config = ['config.ts', 'sidebar.ts']
      .map(file => readFileSync(join(docs, '.vitepress', file), 'utf8'))
      .join('\n');
    expect(config).not.toContain("prefix + 'api/'");
    expect(config).toContain('development/common-tasks');
    expect(config).toContain('customization/extension-behavior');
    const stale = markdown.filter(file =>
      /\]\(\/(?:zh\/)?(?:api|migration)\//.test(readFileSync(file, 'utf8')),
    );
    expect(stale.map(file => relative(docs, file))).toEqual([]);
  });
});
