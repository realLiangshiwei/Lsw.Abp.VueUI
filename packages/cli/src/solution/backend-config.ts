import { copyFile, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { applyEdits, modify, parse, type FormattingOptions } from 'jsonc-parser';
import type { Rollback } from '../system/rollback.js';
import type { Solution } from './locate.js';

/** One value the CLI changed in a solution's configuration. */
export interface BackendEdit {
  /** Relative to the backend root; command results report paths from the project root. */
  file: string;
  /** As appsettings names it, e.g. `App:CorsOrigins`. */
  key: string;
  from?: string | undefined;
  to: string;
}

export interface ConfigureOptions {
  preview?: ((file: string, before: string, after: string) => void) | undefined;
  solution: Solution;
  /** Where the frontend is served from; the only value any of these edits carries. */
  appUrl: string;
  dryRun?: boolean | undefined;
  /** Writes a copy beside each file before changing it (design 08 §4, S2). */
  backup?: boolean | undefined;
  /** Told how to put each file back as it was, for a command that may not finish. */
  rollback?: Rollback | undefined;
}

/** ABP writes its appsettings with two spaces; a file that disagrees keeps its own. */
function formattingOf(text: string): FormattingOptions {
  const indent = /\n([ \t]+)"/.exec(text)?.[1] ?? '  ';

  return {
    insertSpaces: !indent.startsWith('\t'),
    tabSize: indent.length,
    eol: text.includes('\r\n') ? '\r\n' : '\n',
  };
}

/**
 * The comma separated list ABP reads these settings as, with the origin added once. A
 * list that already names it comes back untouched, down to the trailing comma the
 * official templates leave in: a command that edits someone's files should not rewrite a
 * value that was already right.
 */
function withOrigin(current: unknown, origin: string): string {
  const text = typeof current === 'string' ? current : '';
  const kept = text
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);

  return kept.includes(origin) ? text : [...kept, origin].join(',');
}

class ConfigFile {
  private text = '';
  private original = '';
  readonly edits: BackendEdit[] = [];

  constructor(
    private readonly path: string,
    private readonly name: string,
  ) {}

  async read(): Promise<boolean> {
    this.text = await readFile(this.path, 'utf8').catch(() => '');
    this.original = this.text;

    return this.text !== '';
  }

  value(path: readonly (string | number)[]): unknown {
    return path.reduce<unknown>(
      (node, segment) => (node as Record<string, unknown> | undefined)?.[segment],
      parse(this.text) as unknown,
    );
  }

  set(path: readonly (string | number)[], value: string): void {
    const from = this.value(path);
    if (from === value) return;

    this.text = applyEdits(
      this.text,
      modify(this.text, [...path], value, { formattingOptions: formattingOf(this.text) }),
    );

    this.edits.push({
      file: this.name,
      key: path.join(':'),
      from: typeof from === 'string' ? from : undefined,
      to: value,
    });
  }

  async write(options: Pick<ConfigureOptions, 'backup' | 'rollback'>): Promise<void> {
    if (this.edits.length === 0) return;

    if (options.backup) {
      await copyFile(this.path, `${this.path}.${Date.now()}.bak`);
    }

    const original = this.original;
    options.rollback?.add(`put ${this.name} back as it was`, () =>
      writeFile(this.path, original, 'utf8'),
    );

    await writeFile(this.path, this.text, 'utf8');
  }

  preview(options: ConfigureOptions): void {
    if (this.edits.length > 0) options.preview?.(this.name, this.original, this.text);
  }
}

/**
 * Points an ABP solution at the frontend: the OpenIddict client's redirect URIs, the
 * allowed CORS origins, and the redirect allow list where the solution has one.
 *
 * None of this is optional and none of it depends on the port. A solution generated with
 * `-u no-ui` has no `CorsOrigins` key at all, and its `{Project}_App` client has no
 * `RootUrl` -- which is what the seeder builds the redirect URIs from, so without it the
 * client has nowhere to send anyone back to (design 08 §3).
 *
 * @param options The solution, and where its frontend will be served from
 */
export async function configureBackend(options: ConfigureOptions): Promise<BackendEdit[]> {
  const { solution, appUrl } = options;
  const edits: BackendEdit[] = [];

  const files: ConfigFile[] = [];
  const open = async (project: string | undefined): Promise<ConfigFile | undefined> => {
    if (!project) return undefined;

    const path = join(project, 'appsettings.json');
    const file = new ConfigFile(path, relative(solution.root, path));
    if (!(await file.read())) return undefined;

    files.push(file);
    return file;
  };

  const migrator = await open(solution.projects['DbMigrator']);
  migrator?.set(['OpenIddict', 'Applications', solution.clientId, 'RootUrl'], appUrl);

  // With a separate identity server both hosts answer the frontend, so both need to
  // allow its origin.
  for (const project of ['HttpApi.Host', 'AuthServer']) {
    const file = await open(solution.projects[project]);
    if (!file) continue;

    file.set(['App', 'CorsOrigins'], withOrigin(file.value(['App', 'CorsOrigins']), appUrl));

    // Not every template has this one, and creating it would turn an open list into a
    // list of exactly one URL.
    const redirects = file.value(['App', 'RedirectAllowedUrls']);
    if (redirects !== undefined) {
      file.set(['App', 'RedirectAllowedUrls'], withOrigin(redirects, appUrl));
    }
  }

  for (const file of files) {
    edits.push(...file.edits);
    file.preview(options);
    if (!options.dryRun) await file.write(options);
  }

  return edits;
}
