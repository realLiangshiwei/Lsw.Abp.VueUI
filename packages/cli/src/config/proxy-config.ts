import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ServiceType } from '../generator/generate.js';

export const PROXY_CONFIG_FILE = 'generate-proxy.json';

/** What a module contributed, kept so `refresh` can replay the same generation. */
export interface ProxyConfigModule {
  rootPath: string;
  remoteServiceName: string;
}

export interface ProxyConfig {
  /** Every file the last generation wrote, relative to the target directory. */
  generated: string[];
  /** What the last generation deleted, so a surprising disappearance is traceable. */
  removed: string[];
  modules: Record<string, ProxyConfigModule>;
  /** The options the generation ran with; `refresh` reuses them. */
  source: ProxyConfigSource;
}

export interface ProxyConfigSource {
  url?: string | undefined;
  serviceType?: ServiceType | undefined;
  rootNamespace?: string | undefined;
  apiName?: string | undefined;
  index?: boolean | undefined;
  validators?: boolean | undefined;
  policyNames?: boolean | undefined;
}

export const EMPTY_PROXY_CONFIG: ProxyConfig = {
  generated: [],
  removed: [],
  modules: {},
  source: {},
};

/**
 * The configuration of the proxy already in a directory, or an empty one when there is
 * none. A directory with no configuration is the first run, not an error.
 * @param target The directory the proxy is written to
 */
export async function readProxyConfig(target: string): Promise<ProxyConfig> {
  try {
    const text = await readFile(join(target, PROXY_CONFIG_FILE), 'utf8');
    return { ...EMPTY_PROXY_CONFIG, ...(JSON.parse(text) as Partial<ProxyConfig>) };
  } catch {
    return { ...EMPTY_PROXY_CONFIG };
  }
}

/** The configuration as it is written to disk: sorted, so a rerun makes no diff. */
export function serializeProxyConfig(config: ProxyConfig): string {
  const modules = Object.fromEntries(
    Object.entries(config.modules).sort(([left], [right]) => (left < right ? -1 : 1)),
  );

  return `${JSON.stringify(
    {
      generated: [...config.generated].sort(),
      removed: [...config.removed].sort(),
      modules,
      source: config.source,
    },
    null,
    2,
  )}\n`;
}

export async function writeProxyConfig(target: string, config: ProxyConfig): Promise<void> {
  await writeFile(join(target, PROXY_CONFIG_FILE), serializeProxyConfig(config), 'utf8');
}
