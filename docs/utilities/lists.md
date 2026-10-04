# Lists and preferences

Use `useListService` for a list backed by a paged endpoint. The page owns controls, columns, selection and CRUD; the composable coordinates query state, cancellation and saved preferences.

## Prepare the backend and page

Follow [the backend examples](/tutorials/backend-examples) to expose `/api/app/documentation-catalog`. This teaching endpoint supports `filter`, `category`, `minPrice`, `sorting`, `skipCount` and `maxResultCount`, and returns `{ items, totalCount }`. Sign in with a user granted `AbpIdentity.Users`.

Create `src/pages/CataloguePage.vue` with the following code. Its endpoint is the supplied sample, not an assumed part of every ABP application. Keep the Core and Basic Theme providers from the generated application; its layout already renders confirmation and notification hosts.

<<< ../examples/ListExample.vue

Register `/catalogue` as shown in the backend tutorial. Add `BookStore::Books` to your localization resource. The sample's other labels are English literals to keep the query flow visible; localize them with computed labels in your application.

## Search, combine and reset filters

Typing into Search changes `list.filter` and starts a debounced request. Category and Minimum price are additional refs: the fetcher adds them to the request, and their watcher calls `get()` to reset the page. All three predicates apply on the server before counting and paging. Filtering only the downloaded page would produce incorrect totals.

Try creating `Atlas` with category Reference and price 20, and `Novel` with category Fiction and price 5. Search for Atlas, choose Reference and set Minimum price to 10: only Atlas should appear. Reset filters clears all controls and returns to page zero. Clearing the minimum means no price predicate; zero is an actual value.

`hookToQuery` starts the initial request. Do not also fetch from `onMounted` merely to initialize the same list. Vue batches synchronous state changes; the query watcher coordinates the final state. The fetcher receives an `AbortSignal`, which is forwarded to RestService.

## Sort and page on the server

The table emits sorting changes. It does not reorder server rows. The example watches `sortKey`, `sortOrder` and page size **before registering the query**, and resets the page to zero. This ensures a new sort is not requested with the old page offset.

Pages are zero based: page 1 with size 10 sends `skipCount: 10`. Bind the pager to the server's `totalCount`, not `items.length`. Only mark a column sortable when the endpoint accepts its id. The sample allows name and price and uses an id tie-breaker for stable paging.

The UI's third sort click clears the sort direction. With an existing key and no direction, the query contains the field name alone; the sample backend interprets it as ascending. Define your own backend's default consistently rather than assuming the control sorts records.

## Refresh, retry and empty results

`get()` returns to page zero; `getWithoutPageReset()` repeats the current query. Refresh and Retry use the latter. A failed query retains previous rows and exposes the returned `error`; successful empty results show the empty slot instead.

Stop the sample backend and choose Refresh to see the failed-query state. Restart it and Retry. The generic HTTP handler may also report the failure; this page's message explains the state of the list rather than displaying the same exception twice. Do not represent an error as an empty successful response.

## Create, edit and delete

New book resets an owned form. Edit reads full detail before opening it. Validation runs before a save, a busy guard prevents repeated submissions, and a failed save leaves the draft and field errors available. Cancel calls the modal's guarded footer close.

After creating, `get()` returns to the first page. After updating, `getWithoutPageReset()` keeps the current page. Current filters still apply: a successfully created or edited book may not match them.

Delete asks for confirmation, waits for the server and only then removes its id from selection. If the new total no longer contains the current page, the page moves to the last valid index and reloads. A failed deletion retains both rows and selection. Try size 5 with six matching books, move to page 2 and delete its last row: the list returns to page 1.

## Selection and saved preferences

`record-key="id"` gives stable identity across sorting. The table stores selected ids separately from query state; this sample clears them when filters change and retains selection across pages. Only visible page ids are changed by the header checkbox. A bulk endpoint must authorize every id again.

`persistKey: 'Documentation.Catalogue'` saves page size and sorting per user. It does not save filter values, page number or selection. Reload the page after changing size and sort to check restoration; logout clears only the current user's preferences. Use a new stable key or migrate saved values when the page schema changes. Never use a translated label as the key.

`AbpExtensibleTable` can share a list key to save hidden columns. An ordinary application page uses its own columns and does not need an extension container.

## Diagnose the query

Inspect the actual URL and response when a page looks wrong. Verify that all filters are accepted, sorting happens before skip/take, and totalCount describes the filtered set. Check that the page has only one query registration and that neither the fetcher nor its computed parameters call `get()` recursively.

See [DataTable](/components/data-table), [pagination](/components/pagination), [forms](/utilities/forms) and [request cancellation](/utilities/requests).
