import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { CliError } from '../errors.js';

export const TEMPLATE_MANIFEST_FILE = 'template.json';

/**
 * A part of the template that is there only when it was asked for. A `module` is one of
 * the ABP module UIs; a `feature` is anything else the flags can turn on.
 */
export interface TemplateBlock {
  kind: 'module' | 'feature';
  /** Files that exist for this block alone, relative to the template root. */
  files?: string[] | undefined;
}

export interface TemplateManifest {
  blocks: Record<string, TemplateBlock>;
}

/**
 * What the template says about itself. The manifest is the template's own declaration of
 * which parts are optional, so adding a module means editing the template, not the CLI.
 *
 * @param source The template directory
 */
export async function readTemplateManifest(source: string): Promise<TemplateManifest> {
  const path = join(source, TEMPLATE_MANIFEST_FILE);

  try {
    const parsed = JSON.parse(await readFile(path, 'utf8')) as Partial<TemplateManifest>;
    return { blocks: parsed.blocks ?? {} };
  } catch (error) {
    throw new CliError(`The template at ${source} has no readable ${TEMPLATE_MANIFEST_FILE}.`, {
      cause: error,
    });
  }
}

/** The names of the module UIs the template can wire up, in the order it lists them. */
export function moduleBlocks(manifest: TemplateManifest): string[] {
  return Object.entries(manifest.blocks)
    .filter(([, block]) => block.kind === 'module')
    .map(([name]) => name);
}
