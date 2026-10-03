import { GenerationReport } from '../generator/report.js';
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
  /** Where the page goes, relative to the project root. */
  target: string;
  /** The file that declares the project's routes; absent when `--no-router`. */
  routesPath?: string | undefined;
  /** What is on disk already, keyed by the same paths this returns. */
  existing: Record<string, string>;
  /** Replaces a page that is already there. */
  force?: boolean | undefined;
  autoImports?: boolean | undefined;
  report?: GenerationReport | undefined;
}

/** Where the page goes, which a caller reads before generating it. */
export function pagePathsOf(page: EntityPage, target: string): { page: string } {
  return {
    page: `${target}/${page.plural}Page.vue`,
  };
}

/**
 * The files of a CRUD page for one entity. Nothing is written here, the same way the
 * proxy generator writes nothing: the result is what a command prints for `--dry-run`
 * and what it writes otherwise.
 *
 * A page that is already there is left alone unless `force` says otherwise, and even
 * then the page is replaced. Its controls and commands belong to the application.
 *
 * @param options The entity, where its files go and what is on disk
 */
export function generatePage(options: GeneratePageOptions): GeneratePageResult {
  const report = options.report ?? new GenerationReport();
  const page = options.page;
  const paths = pagePathsOf(page, options.target);

  const files: GeneratedFile[] = [
    resolve(paths.page, emitPage(page, options.autoImports), options),
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
function resolve(path: string, content: string, options: GeneratePageOptions): GeneratedFile {
  const existing = options.existing[path];

  if (existing === undefined) return { path, content, action: 'created' };
  if (!options.force) return { path, content: existing, action: 'kept' };

  return { path, content, action: existing === content ? 'unchanged' : 'updated' };
}
