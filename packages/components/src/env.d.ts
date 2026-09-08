/**
 * What the extension inspector's gate reads. Declared here rather than through
 * `vite/client` so the package's own declarations depend on no bundler's, and optional
 * so a bundler that defines nothing gets `undefined` rather than a crash.
 *
 * Not published: `tsconfig.build.json` leaves it out, and a consumer's own
 * `vite/client` would collide with it.
 */
interface ImportMeta {
  readonly env?: { readonly DEV?: boolean };
}
