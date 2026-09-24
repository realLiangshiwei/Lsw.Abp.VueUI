import { CliError } from '../errors.js';
import type { EntityPage } from './entity.js';

/** The declaration a project's own routes are in, as the template writes it. */
const ROUTES = /export\s+const\s+routes\s*(?::[^=]+)?=\s*\[/;

/**
 * The end of the array that starts at `open`, skipping what a bracket inside a string,
 * a template or a comment would otherwise do to the count. There is no TypeScript
 * parser here on purpose: the CLI is a Node tool that a project installs, and a parser
 * is ten megabytes to insert one object literal.
 *
 * @param source The file
 * @param open Index of the `[`
 */
function closingBracket(source: string, open: number): number {
  let depth = 0;

  for (let index = open; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];

    if (character === '/' && next === '/') {
      index = source.indexOf('\n', index);
      if (index < 0) break;
      continue;
    }

    if (character === '/' && next === '*') {
      index = source.indexOf('*/', index + 2) + 1;
      if (index < 1) break;
      continue;
    }

    if (character === "'" || character === '"' || character === '`') {
      index = endOfString(source, index);
      continue;
    }

    if (character === '[' || character === '{' || character === '(') depth += 1;

    if (character === ']' || character === '}' || character === ')') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }

  throw new CliError('The routes array is never closed; the file does not parse.');
}

/** The index of the quote that ends the string starting at `open`. */
function endOfString(source: string, open: number): number {
  const quote = source[open];

  for (let index = open + 1; index < source.length; index += 1) {
    if (source[index] === '\\') {
      index += 1;
      continue;
    }

    if (source[index] === quote) return index;
  }

  return source.length;
}

/** `// abpv:begin route:books` … `// abpv:end route:books`. */
function markerOf(page: EntityPage): string {
  return `route:${page.fileBase}`;
}

/**
 * The order the new entry takes in the menu: after everything already there, so a page
 * generated today does not push yesterday's around.
 */
function nextOrder(source: string): number {
  const orders = [...source.matchAll(/\border:\s*(\d+)/g)].map(match => Number(match[1]));

  return Math.max(0, ...orders) + 1;
}

/**
 * The route of a generated page, as it is written into the routes file.
 * @param page The page
 * @param order Where it sits in the menu
 */
export function routeEntry(page: EntityPage, order: number): string {
  const meta = [
    `      title: '${page.menuKey}',`,
    ...(page.policies.list ? [`      requiredPolicy: '${page.policies.list}',`] : []),
    `      routes: { name: '${page.menuKey}', order: ${order}${
      page.icon ? `, iconClass: '${page.icon}'` : ''
    } },`,
  ];

  return [
    `  // abpv:begin ${markerOf(page)}`,
    '  {',
    `    path: '${page.route}',`,
    `    component: () => import('./pages/${page.plural}Page.vue'),`,
    '    meta: {',
    ...meta,
    '    },',
    '  },',
    `  // abpv:end ${markerOf(page)}`,
  ].join('\n');
}

export interface RouteInsertion {
  /** The file as it should be written. */
  source: string;
  /** False when the file already said exactly this. */
  changed: boolean;
  /** True when an entry for this page was already there and has been replaced. */
  replaced: boolean;
}

/**
 * Puts the page's route into a routes file, or brings the one that is there up to date.
 * The entry is wrapped in markers, which is what makes the second run a replacement
 * rather than a duplicate.
 *
 * @param source The routes file
 * @param page The page whose route to write
 */
export function insertRoute(source: string, page: EntityPage): RouteInsertion {
  const marker = markerOf(page);
  const begin = source.indexOf(`// abpv:begin ${marker}`);

  if (begin >= 0) {
    const endMarker = `// abpv:end ${marker}`;
    const end = source.indexOf(endMarker, begin);

    if (end < 0) throw new CliError(`${marker} is opened in the routes file but never closed.`);

    const existing = source.slice(begin, end + endMarker.length);
    const entry = routeEntry(page, nextOrder(source.slice(0, begin))).trimStart();
    const next = source.slice(0, begin) + entry + source.slice(end + endMarker.length);

    return { source: next, changed: existing !== entry, replaced: true };
  }

  const declaration = ROUTES.exec(source);

  if (!declaration) {
    throw new CliError(
      'No `export const routes = [` in the routes file. Pass --routes with the file that ' +
        'declares them, or --no-router and add the route by hand.',
    );
  }

  const open = declaration.index + declaration[0].length - 1;
  const close = closingBracket(source, open);
  const before = source.slice(0, close);
  const entry = routeEntry(page, nextOrder(source));

  // A trailing comma may or may not be there; the entry brings its own.
  const separator = /,\s*$/.test(before) || /\[\s*$/.test(before) ? '' : ',';

  return {
    source: `${before.replace(/\s*$/, '')}${separator}\n${entry}\n${source.slice(close)}`,
    changed: true,
    replaced: false,
  };
}
