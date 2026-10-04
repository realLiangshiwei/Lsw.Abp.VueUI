# Create a reusable module

A reusable module exposes lightweight startup configuration, lazy routes, generated proxies and extension options. This tutorial uses a Blogging UI package; it assumes you already have a backend module to connect.

## 1. Create and build the package

From a directory outside an existing package:

~~~bash
abpv create-lib Blogging --package @acme/blogging-vue --target packages/blogging
cd packages/blogging
pnpm install
pnpm typecheck
pnpm build
~~~

The package has root, `/config` and `/proxy` entries. The generated component key is `Blogging.BloggingComponent` and its initial route is `/blogging`. These are starter names, not the names of an existing blogging backend.

## 2. Align the backend contract

The starter talks to `/api/blogging` using RestService. Its starter policies are `Blogging.Blogging` and matching Create/Update/Delete names. Replace these with the module's actual endpoints, policies and localization keys.

Generate proxies from a running backend:

~~~bash
abpv proxy add --module blogging --target proxy/src
~~~

Run from the package directory with its API URL configured, or pass the proxy command's `--url` option. `--module` is the api-definition module name, not necessarily the npm package name. If that name is absent in the backend metadata, choose the actual name.

Replace `src/models/blogging.ts` and page calls with the generated DTOs/service. Adapt the fields, sorting and create/update body, including concurrency and extra properties. The proxy index must expose the generated public service; verify the build's export entries rather than importing internal dist files.

## 3. Install in the host

Use your workspace link or, after building, create a tarball:

~~~bash
pnpm pack --pack-destination /tmp
~~~

Install the actual emitted tarball path in the host frontend with `pnpm add /tmp/<tarball-name>.tgz`. The shared ABP Vue packages are peer dependencies and must resolve to the host's single instance.

In host startup:

~~~ts
import { provideBloggingConfig } from '@acme/blogging-vue/config';

const providers = [
  // Existing core, router, OAuth and theme providers...
  provideBloggingConfig(),
];
~~~

In host routes:

~~~ts
import { lazyRoutes } from '@lsw-abpvue/core/router';

const bloggingRoute = lazyRoutes('/blogging', () =>
  import('@acme/blogging-vue').then(module => module.createBloggingRoutes()),
);
~~~

Add `bloggingRoute` to the route array used by `provideAbpRouter`. The lightweight config adds the menu without eagerly importing the page.

## 4. Let the host extend it

~~~ts
import { EntityProp, PropType } from '@lsw-abpvue/components';
import { BloggingComponents, type BloggingConfigOptions, type BloggingDto } from '@acme/blogging-vue';

const options = {
  entityPropContributors: {
    [BloggingComponents.Blogging]: [
      props => props.addTail(EntityProp.create<BloggingDto>({
        name: 'displayName',
        type: PropType.String,
        displayName: 'Blogging::DisplayName',
        valueResolver: data => data.record.name || '',
      })),
    ],
  },
} satisfies BloggingConfigOptions;
~~~

Pass `options` to `createBloggingRoutes(options)`. This example uses the starter DTO; update its type import when replacing that DTO with a generated proxy. Make component keys and contributor options stable before another application depends on them.

## 5. Verify the consumer

In the host, run typecheck/build, log in with the real backend policy, open the menu, query data and test CRUD. Check a contributed column and a component replacement through the public key. Run this against the tarball too so workspace-only resolution cannot hide packaging mistakes.

Keep theme controls imported from theme-shared and shared framework packages as peers. See [create-lib](/cli/create-lib), [extensions](/concepts/extensions) and [package dependencies](/concepts/packages).
