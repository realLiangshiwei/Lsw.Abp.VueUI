# Browser and server boundaries

Framework services use platform abstractions instead of assuming browser globals are always present.

| Service | Responsibility |
| --- | --- |
| `WindowService` | Window, location and browser navigation |
| `DocumentService` | Document and DOM access |
| `StorageService` | Browser storage with server-safe behavior |
| `CookieService` | Cookie reading and writing |

Inject the appropriate service in reusable framework code. `nativeWindow` or the native document may be absent outside a browser; guard access before using browser-only features.

## Scope and state

Keep mutable state on service instances or within Vue scopes. Module-level mutable state can cross requests in server rendering and can leak between application instances.

Tokens are symbols shared by physical package instances. Avoid bundling a second copy of core into a library. Sibling ABP Vue packages use peer dependencies so the application supplies one instance.

## SSR support boundary

Platform-safe services and replaceable token storage are building blocks for server rendering. The generated application is a client SPA; these abstractions do not turn it into a complete SSR template. An SSR host must provide request-specific environment, transport and authentication storage and avoid sharing user state between requests.
