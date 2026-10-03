import { basename, dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { CliError } from '../errors.js';

export const BACKEND_DIRECTORY = 'aspnet-core';

export function projectRootOf(backend: string): string {
  return basename(backend) === BACKEND_DIRECTORY ? dirname(backend) : backend;
}

function contains(parent: string, child: string): boolean {
  const path = relative(parent, child);
  return path === '' || (!isAbsolute(path) && path !== '..' && !path.startsWith(`..${sep}`));
}

export function frontendDirectoryOf(root: string, backend: string, directory = 'vue'): string {
  const target = resolve(root, directory);
  if (
    isAbsolute(directory) ||
    target === root ||
    !contains(root, target) ||
    (backend !== root && (contains(backend, target) || contains(target, backend)))
  ) {
    throw new CliError(
      `--dir "${directory}" must stay inside the project and separate from the backend. Use vue or another frontend subdirectory.`,
    );
  }

  return target;
}
