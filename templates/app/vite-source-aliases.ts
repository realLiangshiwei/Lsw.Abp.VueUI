import { dirname, resolve } from 'node:path';
import { flattenDiagnosticMessageText, readConfigFile, sys } from 'typescript';
import type { Alias } from 'vite';

class SourceAliasConfigError extends Error {}

function readJson<T>(path: string): T {
  const result = readConfigFile(path, sys.readFile);
  if (result.error) {
    throw new SourceAliasConfigError(
      `Cannot read package aliases from ${path}: ${flattenDiagnosticMessageText(result.error.messageText, '\n')}`,
    );
  }
  return result.config as T;
}

export function abpSourceResolution(configPath: string): { alias: Alias[]; exclude: string[] } {
  const config = readJson<{
    compilerOptions?: { paths?: Record<string, string[]> | undefined } | undefined;
  }>(configPath);

  const alias = Object.entries(config.compilerOptions?.paths ?? {})
    .filter(
      ([name, targets]) => name.startsWith('@lsw-abpvue/') && !name.includes('*') && targets[0],
    )
    .map(([name, targets]) => ({
      find: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`),
      replacement: resolve(dirname(configPath), targets[0] as string),
    }));

  if (!alias.length) return { alias, exclude: [] };

  const manifest = readJson<{
    dependencies?: Record<string, string> | undefined;
    devDependencies?: Record<string, string> | undefined;
  }>(resolve(dirname(configPath), 'package.json'));

  // Prebundling an installed module would embed core while the app loads its source.
  const exclude = Object.keys({ ...manifest.dependencies, ...manifest.devDependencies }).filter(
    name => name.startsWith('@lsw-abpvue/'),
  );
  return { alias, exclude };
}
