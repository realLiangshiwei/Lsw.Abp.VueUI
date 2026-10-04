# Lists and preferences

`useListService` coordinates filtering, sorting, page size and zero-based page numbers. Connect one backend fetcher to `hookToQuery` and bind the returned items and total count.

<<< ../examples/ListExample.vue

The example reads `/api/app/book`; replace that URL and record type with your application's endpoint. Column headers are localized by the caller. The table changes `sortKey` and `sortOrder` through named models; it does not perform server sorting itself.

## Refresh and concurrency

`get()` resets to page zero and reloads. `getWithoutPageReset()` reloads the current page. The default debounce is 300 ms and default page size is 10. Query changes cancel obsolete work, and only the latest result updates the list. The fetcher receives an `AbortSignal`; pass it to the backend request.

`requestStatus` distinguishes idle, loading, success and error. Use it to disable repeated actions and display loading feedback. The query includes `skipCount`, `maxResultCount`, sorting and filter.

## Saved preferences

Give the list a stable `persistKey` to save page size and sorting per user. `AbpExtensibleTable` can share that key to save explicitly hidden columns. Filters and current page are not saved. Built-in modules use their public component key as the preference key.

Invalid stored values fall back to defaults. Logout clears only the current user's preferences. See [application state](/concepts/state) for custom-authentication cleanup.
