# Document title strategy

The router updates the browser tab title after a successful navigation. This is separate from the page heading and menu label.

## Declare a route title

~~~ts
const route = {
  path: '/books',
  component: () => import('../pages/BooksPage.vue'),
  meta: { title: 'BookStore::Menu:Books' },
};
~~~

With `environment.application.name = 'BookStore'` and an English translation of `Books`, the default result is `Books | BookStore`.

| Condition | Result |
| --- | --- |
| Route has `meta.title` | Localized route title followed by application name |
| Route has no title | Application name |
| Language changes | Active title recalculates |
| Navigation fails | Existing title remains |

Vue Router merges matched route metadata; the active `to.meta.title` is used. Declare an explicit title on a child route when it should differ from its parent.

The application name comes from `environment.application.name` and is used as plain text. Use a custom strategy when the application name also needs localization.

## Remove the suffix

~~~ts
provideAbpCore(withOptions({
  environment,
  disableProjectNameInTitle: true,
}));
~~~

A titled route then displays `Books`. An untitled route still displays the application name. This option belongs to Core options; it is not a route property.

## Replace the strategy

Create `src/custom-title.ts`:

<<< ../examples/custom-title.ts

The example produces `BookStore — Books` and explicitly subscribes to language changes during initialization. Register it with the router and initializer:

~~~ts
import { customTitleFeature, initializeCustomTitle } from './custom-title';

const providers = [
  provideAbpCore(withOptions({ environment })),
  provideAbpRouter(routes, customTitleFeature),
  initializeCustomTitle,
  // OAuth, theme and module providers...
];
~~~

The names `environment` and `routes` refer to your existing startup configuration. `withTitleStrategy` is imported from `@lsw-abpvue/core/router` and passed to `provideAbpRouter`. The replacement implements `setTitle(title: string | undefined): void`; its service can inject platform and localization services.

Use `DocumentService` for document access and dispose subscriptions with the service. Keep route titles, `AbpPage.title` and navigation labels consistent, while remembering that they serve separate UI elements.

## Verify

Navigate to a titled route, switch language, visit an untitled route, then test a refused navigation. Check the browser tab in each case. See [routing](/concepts/routes-and-menu).
