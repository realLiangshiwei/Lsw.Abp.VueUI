import { createRequire } from 'node:module';
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

export function abpSourceResolution(configPath: string): {
  alias: Alias[];
  exclude: string[];
  include: string[];
} {
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

  const manifest = readJson<{
    dependencies?: Record<string, string> | undefined;
    devDependencies?: Record<string, string> | undefined;
  }>(resolve(dirname(configPath), 'package.json'));

  const runtime = Object.keys(manifest.dependencies ?? {});
  const include = runtime.filter(name =>
    [
      'vue',
      'vue-router',
      'oidc-client-ts',
      'reka-ui',
      '@tanstack/vue-table',
      '@internationalized/date',
    ].includes(name),
  );
  if (!alias.length) {
    const installed = createRequire(configPath);
    for (const name of runtime.filter(name => name.startsWith('@lsw-abpvue/'))) {
      const pkg = readJson<{
        exports: Record<string, string | { import?: string | undefined }>;
      }>(installed.resolve(`${name}/package.json`));
      for (const [entry, target] of Object.entries(pkg.exports)) {
        const path = typeof target === 'string' ? target : target.import;
        if (path && /\.m?js$/.test(path)) {
          include.push(entry === '.' ? name : `${name}${entry.slice(1)}`);
        }
      }
    }
    return { alias, exclude: [], include };
  }

  // Prebundling an installed module would embed core while the app loads its source.
  const exclude = Object.keys({ ...manifest.dependencies, ...manifest.devDependencies }).filter(
    name => name.startsWith('@lsw-abpvue/'),
  );
  return { alias, exclude, include };
}
