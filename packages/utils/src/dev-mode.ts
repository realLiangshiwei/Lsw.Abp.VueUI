/**
 * Whether the bundle was built for development, which is the only time the library warns
 * about things it can still work around.
 *
 * `import.meta.env.DEV` is written out in one piece on purpose: that is the expression a
 * bundler substitutes, and reading it through a variable -- as this did until 2026-09-04
 * -- leaves `import.meta.env` undefined in a development server as well as in a
 * production build, which made every warning behind it dead code. The optional chain is
 * what keeps a bundler that defines nothing from throwing.
 *
 * @see https://angular.dev/api/core/isDevMode
 */
export function isDevMode(): boolean {
  return (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV === true;
}
