import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'docs/.vitepress/dist');
const base = '/Lsw.Abp.VueUI/';
const origin = 'https://docs.invalid';

function* htmlFiles(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(file);
    else if (entry.name.endsWith('.html')) yield file;
  }
}

function decodeAttribute(value) {
  const entities = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>' };
  return value.replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt);/gi, (_, entity) => {
    if (entity.startsWith('#')) {
      const hex = entity[1].toLowerCase() === 'x';
      return String.fromCodePoint(Number.parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10));
    }
    return entities[entity.toLowerCase()];
  });
}

const pages = new Map(
  [...htmlFiles(dist)].map(file => {
    const html = readFileSync(file, 'utf8');
    return [
      file,
      {
        ids: new Set(
          [...html.matchAll(/\bid=["']([^"']*)["']/g)].map(match => decodeAttribute(match[1])),
        ),
        links: [...html.matchAll(/<a\b[^>]*\bhref=["']([^"']*)["']/g)].map(match =>
          decodeAttribute(match[1]),
        ),
      },
    ];
  }),
);
const errors = new Set();
let checked = 0;

for (const [file, page] of pages) {
  const sourceUrl = origin + base + relative(dist, file).replaceAll('\\', '/');
  for (const href of page.links) {
    const url = new URL(href, sourceUrl);
    if (url.origin !== origin || !url.pathname.startsWith(base)) continue;
    const path = decodeURIComponent(url.pathname.slice(base.length));
    let target = resolve(dist, path);
    if (url.pathname.endsWith('/')) target = join(target, 'index.html');
    else if (!extname(target)) target += '.html';
    const label = relative(dist, file) + ' -> ' + href;
    if (!existsSync(target)) {
      errors.add(label + ' (missing page)');
      continue;
    }
    const targetPage = pages.get(target);
    if (!targetPage) continue;
    checked++;
    const anchor = decodeURIComponent(url.hash.slice(1));
    if (anchor && !targetPage.ids.has(anchor)) errors.add(label + ' (missing anchor)');
  }
}

console.log('Documentation links: ' + pages.size + ' pages, ' + checked + ' internal links.');
if (errors.size) {
  for (const error of errors) console.error(error);
  process.exitCode = 1;
}
