import { copyFile, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { CliError } from '../errors.js';
import { readTemplateManifest, TEMPLATE_MANIFEST_FILE, type TemplateManifest } from './manifest.js';

/**
 * What the placeholders in the template stand for. Every key is one `__SCREAMING_SNAKE__`
 * token in the files; a token with no key here is a mistake in the template rather than
 * something to leave for the reader to find.
 */
export interface TemplateValues {
  /** The solution name `abp new` was given, e.g. `Acme.BookStore`. */
  projectName: string;
  /** What ABP calls the project: the last segment, which is also its localization resource. */
  appName: string;
  clientId: string;
  apiUrl: string;
  authUrl: string;
  appUrl: string;
}

export interface RenderOptions {
  /** The template directory. */
  source: string;
  /** Where the application is written. */
  target: string;
  /** Every `__SCREAMING_SNAKE__` token in the template, by its camelCase name. */
  values: TemplateValues | Record<string, string>;
  /**
   * The name the rendered `package.json` takes; the project name turned into an npm
   * name when absent.
   */
  packageName?: string | undefined;
  /** Replaces the template's own `description`, when the command was given one. */
  description?: string | undefined;
  /**
   * Substrings replaced everywhere -- in the sources, in the configuration and in the
   * file names. A library template has a sample module whose name is part of its code,
   * and a name cannot be spelled `__LIKE_THIS__` in code that has to keep compiling.
   */
  renames?: Record<string, string> | undefined;
  /** The optional blocks to keep; every other one is dropped, its files included. */
  blocks: readonly string[];
  /** What the `workspace:*` ranges become: the version of the CLI doing the rendering. */
  version: string;
  /** Says what would be written and writes nothing. */
  dryRun?: boolean | undefined;
}

export interface RenderResult {
  /** Every file of the application, relative to its root, sorted. */
  written: string[];
  contents: Record<string, string>;
  binary: string[];
}

/** Directories a checked-out template carries that no project should. */
const IGNORED = new Set(['node_modules', 'dist', '.turbo']);

/** Files a text pass would corrupt. There are none in the template yet; there will be. */
const BINARY = /\.(png|jpe?g|gif|ico|webp|woff2?|ttf|eot|pdf|zip)$/i;

const MARKER = /^[ \t]*\/\/ abpv:(begin|end) ([a-z0-9-]+)[ \t]*$/;
const PLACEHOLDER = /__([A-Z0-9_]+)__/g;

/** `projectName` is written `__PROJECT_NAME__` in the files. */
function placeholderOf(key: string): string {
  return `__${key.replace(/[A-Z]/g, letter => `_${letter}`).toUpperCase()}__`;
}

function replacements(values: Record<string, string>): Map<string, string> {
  return new Map(Object.entries(values).map(([key, value]) => [placeholderOf(key), String(value)]));
}

/**
 * Removes the parts of a file that belong to a block nobody asked for, and the markers
 * around the parts that stay. Nesting works because what decides is whether every open
 * block is kept.
 */
export function filterBlocks(text: string, keep: ReadonlySet<string>, file: string): string {
  const kept: string[] = [];
  const open: string[] = [];

  for (const line of text.split('\n')) {
    const marker = MARKER.exec(line);

    if (marker) {
      const name = marker[2] as string;

      if (marker[1] === 'begin') {
        open.push(name);
      } else if (open.pop() !== name) {
        throw new CliError(`${file}: "abpv:end ${name}" closes a block that is not open.`);
      }

      continue;
    }

    if (open.every(block => keep.has(block))) kept.push(line);
  }

  if (open.length > 0) {
    throw new CliError(`${file}: "abpv:begin ${open.at(-1)}" is never closed.`);
  }

  return kept.join('\n');
}

function fill(text: string, values: Map<string, string>, file: string): string {
  return text.replace(PLACEHOLDER, whole => {
    const value = values.get(whole);
    if (value === undefined) {
      throw new CliError(`${file}: ${whole} is not something the CLI knows how to fill in.`);
    }

    return value;
  });
}

/** Applies the identifier renames to a piece of text, longest match first. */
function renamed(text: string, renames: Record<string, string> | undefined): string {
  if (!renames) return text;

  return Object.entries(renames)
    .sort(([left], [right]) => right.length - left.length)
    .reduce((current, [from, to]) => current.split(from).join(to), text);
}

/** `Acme.BookStore` is `acme-bookstore` to npm, which has no room for capitals or dots. */
export function packageNameOf(projectName: string): string {
  return projectName.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
}

/**
 * The manifest of the generated application. The template's own is a workspace member of
 * this repository, which is what keeps it compiling; a project gets its own name and the
 * versions of the CLI that wrote it.
 */
function renderManifest(text: string, options: RenderOptions): string {
  const manifest = JSON.parse(text) as {
    name: string;
    description?: string;
    private?: boolean;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
  };

  manifest.name =
    options.packageName ?? packageNameOf((options.values as TemplateValues).projectName);
  if (options.description) manifest.description = options.description;
  delete manifest.private;

  const groups = [manifest.dependencies, manifest.devDependencies, manifest.peerDependencies];

  for (const group of groups) {
    for (const [name, range] of Object.entries(group ?? {})) {
      const rewritten = versionOf(range, options.version);
      if (rewritten) (group as Record<string, string>)[name] = rewritten;
    }
  }

  return `${JSON.stringify(manifest, null, 2)}\n`;
}

/**
 * What a `workspace:` range becomes outside the workspace, the way `pnpm pack` resolves
 * it: the modifier is kept, so a peer range stays a range. Shipping the protocol itself
 * would break every consumer's install.
 *
 * @param range The range as the template wrote it
 * @param version The version of the CLI doing the rendering
 */
function versionOf(range: string, version: string): string | undefined {
  if (!range.startsWith('workspace:')) return undefined;

  const modifier = range.slice('workspace:'.length);

  return modifier === '^' || modifier === '~' ? `${modifier}${version}` : version;
}

/** Every file under `dir`, relative to it, depth first and in a stable order. */
async function walk(dir: string, prefix = ''): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries.sort((a, b) => (a.name < b.name ? -1 : 1))) {
    if (IGNORED.has(entry.name)) continue;

    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...(await walk(join(dir, entry.name), path)));
    else files.push(path);
  }

  return files;
}

/**
 * A dotfile is stored with a leading underscore in the published CLI, because npm takes
 * `.gitignore` out of a package it publishes. The template in this repository has the
 * real names, and both arrive here.
 */
function outputPath(path: string): string {
  const name = basename(path);

  return name.startsWith('_') ? join(dirname(path), `.${name.slice(1)}`) : path;
}

function droppedFiles(manifest: TemplateManifest, keep: ReadonlySet<string>): Set<string> {
  const dropped = new Set<string>();

  for (const [name, block] of Object.entries(manifest.blocks)) {
    if (keep.has(name)) continue;
    for (const file of block.files ?? []) dropped.add(file);
  }

  return dropped;
}

/**
 * Writes the application template into a directory: the placeholders filled in, the
 * blocks nobody asked for gone, and the workspace ranges turned into real versions.
 *
 * @param options What to render, where, and with which parts
 */
export async function renderTemplate(options: RenderOptions): Promise<RenderResult> {
  const manifest = await readTemplateManifest(options.source);
  const keep = new Set(options.blocks);

  for (const name of keep) {
    if (!(name in manifest.blocks)) {
      throw new CliError(
        `The template has nothing called "${name}". It has: ${Object.keys(manifest.blocks).join(', ')}.`,
      );
    }
  }

  const values = replacements(options.values as Record<string, string>);
  const dropped = droppedFiles(manifest, keep);
  const written: string[] = [];
  const contents: Record<string, string> = {};
  const binary: string[] = [];

  for (const path of await walk(options.source)) {
    if (path === TEMPLATE_MANIFEST_FILE || path === 'CHANGELOG.md' || dropped.has(path)) continue;

    const output = renamed(outputPath(path), options.renames);
    written.push(output);

    const from = join(options.source, path);
    const to = join(options.target, output);
    if (!options.dryRun) await mkdir(dirname(to), { recursive: true });

    if (BINARY.test(path)) {
      binary.push(output);
      if (!options.dryRun) await copyFile(from, to);
      continue;
    }

    const source = await readFile(from, 'utf8');
    const body =
      path === 'package.json'
        ? renderManifest(source, options)
        : fill(filterBlocks(source, keep, path), values, path);

    contents[output] = renamed(body, options.renames);
    if (!options.dryRun) await writeFile(to, contents[output], 'utf8');
  }

  return { written: written.sort(), contents, binary };
}
