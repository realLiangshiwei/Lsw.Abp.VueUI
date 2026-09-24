import { GenerationReport } from '../generator/report.js';
import { mergeBlocks } from './blocks.js';
import { emitExtensions } from './emit-extensions.js';
import { emitPage } from './emit-page.js';
import type { EntityPage } from './entity.js';
import { insertRoute } from './routes.js';

/** What happened, or would happen, to one file. */
export type FileAction = 'created' | 'updated' | 'unchanged' | 'kept';

export interface GeneratedFile {
  /** Relative to the project root. */
  path: string;
  content: string;
  action: FileAction;
  /**
   * Blocks the generation has that the file on disk does not, which is what a file
   * edited past the point of merging looks like.
   */
  missingBlocks?: string[] | undefined;
}

export interface GeneratePageResult {
  page: EntityPage;
  files: GeneratedFile[];
  report: GenerationReport;
}

export interface GeneratePageOptions {
  page: EntityPage;
  /** Where the two page files go, relative to the project root. */
  target: string;
  /** The file that declares the project's routes; absent when `--no-router`. */
  routesPath?: string | undefined;
  /** What is on disk already, keyed by the same paths this returns. */
  existing: Record<string, string>;
  /** Rewrites the generated blocks of files that are already there. */
  force?: boolean | undefined;
  report?: GenerationReport | undefined;
}

/** Where the two files of a page go, which a caller has to know to read them first. */
export function pagePathsOf(
  page: EntityPage,
  target: string,
): { page: string; extensions: string } {
  return {
    page: `${target}/${page.plural}Page.vue`,
    extensions: `${target}/${page.fileBase}.extensions.ts`,
  };
}

/**
 * The files of a CRUD page for one entity. Nothing is written here, the same way the
 * proxy generator writes nothing: the result is what a command prints for `--dry-run`
 * and what it writes otherwise.
 *
 * A page that is already there is left alone unless `force` says otherwise, and even
 * then only the generated blocks of the extensions file are rewritten -- the rest of it
 * is whatever the person who owns the page has made of it.
 *
 * @param options The entity, where its files go and what is on disk
 */
export function generatePage(options: GeneratePageOptions): GeneratePageResult {
  const report = options.report ?? new GenerationReport();
  const page = options.page;
  const paths = pagePathsOf(page, options.target);

  const files: GeneratedFile[] = [
    resolve(paths.page, emitPage(page), options, { merge: false }),
    resolve(paths.extensions, emitExtensions(page), options, { merge: true }),
  ];

  if (options.routesPath) {
    const source = options.existing[options.routesPath];

    if (source === undefined) {
      report.add(
        'skipped',
        `${options.routesPath} is not there, so no route was added. Pass --routes with the file that declares them.`,
      );
    } else {
      const inserted = insertRoute(source, page);

      files.push({
        path: options.routesPath,
        content: inserted.source,
        action: inserted.changed ? 'updated' : 'unchanged',
      });
    }
  }

  return { page, files, report };
}

/** What to do with one generated file, given what is on disk. */
function resolve(
  path: string,
  content: string,
  options: GeneratePageOptions,
  kind: { merge: boolean },
): GeneratedFile {
  const existing = options.existing[path];

  if (existing === undefined) return { path, content, action: 'created' };
  if (!options.force) return { path, content: existing, action: 'kept' };

  if (!kind.merge) {
    return existing === content
      ? { path, content, action: 'unchanged' }
      : { path, content, action: 'updated' };
  }

  const merged = mergeBlocks(existing, content);

  return {
    path,
    content: merged.source,
    action: merged.changed ? 'updated' : 'unchanged',
    ...(merged.missing.length > 0 ? { missingBlocks: merged.missing } : {}),
  };
}
