import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fixture = join(repoRoot, 'e2e/fixtures/application-localization.en.json');

interface Resource {
  texts?: Record<string, string>;
  baseResources?: string[];
}

const resources: Record<string, Resource> = existsSync(fixture)
  ? ((JSON.parse(readFileSync(fixture, 'utf8')) as { resources?: Record<string, Resource> })
      .resources ?? {})
  : {};
/** A resource inherits from the ones it names, the way the localizer resolves them. */
function textsOf(
  name: string,
  available = resources,
  seen = new Set<string>(),
): Record<string, string> {
  const resource = available[name];
  if (!resource || seen.has(name)) return {};
  seen.add(name);

  const inherited = (resource.baseResources ?? []).map(base => textsOf(base, available, seen));
  return Object.assign({}, ...inherited, resource.texts) as Record<string, string>;
}

function* sources(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* sources(path);
    else if (/\.(ts|vue)$/.test(entry.name) && !/\.(spec|test-d)\.ts$/.test(entry.name)) yield path;
  }
}

interface Usage {
  resource: string;
  key: string;
  file: string;
  hasDefault: boolean;
}

const WITH_DEFAULT = /key:\s*\\?['"]([^'"\\]+)\\?['"]\s*,\s*defaultValue:/g;
// Only inside a string literal, and never inside a comment: prose says `Resource::Key`
// too, and a doc comment naming the shape is not a usage of it.
const ANY_KEY = /['"`]([A-Za-z][A-Za-z0-9]*)::([^'"`\\\s$]+)\\?['"`]/g;
const COMMENTS = /\/\*[\s\S]*?\*\/|(?:^|\s)\/\/[^\n]*/g;
const LOCALIZATION_DEFAULT =
  /\b(?:key\s*:(?:\$\{[^}]*\}|[^}]){0,300}?,\s*defaultValue\s*:|defaultValue\s*:(?:\$\{[^}]*\}|[^}]){0,300}?,\s*key\s*:)/g;

function localizationDefaults(source: string): string[] {
  return [...source.replace(COMMENTS, ' ').matchAll(LOCALIZATION_DEFAULT)].map(match => match[0]);
}

function usagesIn(file: string, source = readFileSync(file, 'utf8')): Usage[] {
  const body = source.replace(COMMENTS, ' ');
  const defaulted = new Set([...body.matchAll(WITH_DEFAULT)].map(match => match[1]));

  return [...body.matchAll(ANY_KEY)].map(match => ({
    resource: match[1] as string,
    key: match[2] as string,
    file: relative(repoRoot, file),
    hasDefault: defaulted.has(`${match[1]}::${match[2]}`),
  }));
}

/**
 * Every package's `src`, and every secondary entry point's (`config/src`, `router/src`),
 * plus the application template's. A module's `/config` ships text too -- the setting
 * management tabs live there -- and leaving it out was a whole entry point outside the
 * gate. The template ships text of its own, and a key it gets wrong reaches every project
 * created from it.
 */
function sourceRoots(): string[] {
  const roots: string[] = [join(repoRoot, 'templates/app/src'), join(repoRoot, 'playground/src')];

  for (const entry of readdirSync(join(repoRoot, 'packages'), { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    const packageRoot = join(repoRoot, 'packages', entry.name);
    roots.push(join(packageRoot, 'src'));

    for (const inner of readdirSync(packageRoot, { withFileTypes: true })) {
      // Generated proxies say what the backend says, keys included.
      if (!inner.isDirectory() || inner.name === 'proxy' || inner.name === 'src') continue;
      roots.push(join(packageRoot, inner.name, 'src'));
    }
  }

  return roots.filter(existsSync);
}

function isOssSource(file: string): boolean {
  return (
    !file.startsWith(`playground${sep}`) &&
    file !== join('packages', 'account', 'src', 'defaults', 'texts.ts') &&
    !['identity-pro', 'account-pro', 'audit-logging', 'saas'].some(name =>
      file.startsWith(`${join('packages', name)}${sep}`),
    )
  );
}

const packages = sourceRoots();

const usages = packages.flatMap(dir => [...sources(dir)].flatMap(file => usagesIn(file)));

/**
 * Every `Resource::Key` a package ships has to be one the backend can actually resolve.
 * A missing key must not be hidden by an English default. Host-provided DTO text and
 * form-property default values are separate from a package's own localization messages.
 */
describe('the localization keys the packages ship', () => {
  it('checks escaped keys inside generated source strings', () => {
    const source = String.raw`const cancel = 't(\'AbpUi::Cancel\')';
const custom = 't({ key: \'AbpUi::CustomLabel\', defaultValue: \'Custom\' })';`;
    expect(usagesIn(join(repoRoot, 'example.ts'), source)).toEqual([
      { resource: 'AbpUi', key: 'Cancel', file: 'example.ts', hasDefault: false },
      { resource: 'AbpUi', key: 'CustomLabel', file: 'example.ts', hasDefault: true },
    ]);
  });

  it('detects literal and dynamic localization defaults without rejecting form defaults', () => {
    expect(
      localizationDefaults(
        "localization.t({ key: 'AbpIdentity::SettingsSaveFailed', defaultValue: 'Failed' })",
      ),
    ).toHaveLength(1);
    expect(
      localizationDefaults(
        'localization.t({ key: `AbpIdentity::${key}`, defaultValue: fallback })',
      ),
    ).toHaveLength(1);
    expect(
      localizationDefaults("localization.t({ defaultValue: 'Failed', key: 'AbpUi::New' })"),
    ).toHaveLength(1);
    expect(localizationDefaults("new FormProp({ name: 'name', defaultValue: 'Sample' })")).toEqual(
      [],
    );
  });

  it('has fixtures to check against', () => {
    // Regenerated by `scripts/capture-fixtures.sh` against a live backend.
    expect(Object.keys(resources).length).toBeGreaterThan(0);
  });

  it('finds keys to check', () => {
    expect(usages.length).toBeGreaterThan(0);
  });

  it('ships no frontend localization defaults', () => {
    const defaulted = packages.flatMap(dir =>
      [...sources(dir)].flatMap(file =>
        localizationDefaults(readFileSync(file, 'utf8')).map(() => relative(repoRoot, file)),
      ),
    );
    expect([...new Set(defaulted)]).toEqual([]);
  });

  it('resolves OSS literal keys against the OSS backend resources and inheritance', () => {
    const unresolved = usages
      .filter(usage => isOssSource(usage.file))
      .filter(usage => !(usage.key in textsOf(usage.resource)))
      .map(usage => `${usage.resource}::${usage.key} (${usage.file})`);

    expect([...new Set(unresolved)]).toEqual([]);
  });
});
