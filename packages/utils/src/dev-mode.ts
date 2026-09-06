/**
 * Whether the bundle was built for development, which is the only time the library
 * warns about things it can still work around.
 *
 * Read through a cast rather than `vite/client`'s types: the declarations we publish
 * must not depend on a bundler's, and a bundler that does not define `import.meta.env`
 * should get `false` rather than a crash.
 *
 * @see https://angular.dev/api/core/isDevMode
 */
export function isDevMode(): boolean {
  const meta = import.meta as unknown as { env?: { DEV?: boolean } };
  return meta.env?.DEV === true;
}
