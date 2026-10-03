# Browser performance measurements

From the repository root:

```bash
pnpm --filter playground bench:build
pnpm --filter playground bench:preview
```

Open <http://localhost:4201>, keep the tab in the foreground and click **Run benchmarks**.
The build uses production Vue and the real extensible table, row actions and basic-theme
menu. It is separate from the playground's routes and authentication, and makes no
backend requests.

Five workloads:

- 50 table rows, six data columns and two actions per row.
- 1,000 table rows with the same columns and actions.
- 50 table rows with 50 data columns, including 44 extra properties, and row actions.
- 100 extra properties rendered through the extensible form.
- 1,000 menu entries in 20 groups, moving one entry between the first and last position.

Each workload reports its initial mount, then the median and p95 of 20 updates after one
warm-up. Timing starts before the data changes and ends after Vue's `nextTick` and a
synchronous layout read. The rendered row or entry count checks that the workload was
actually mounted. **Raw samples** contains the individual measurements.

These are client rendering measurements. They exclude network latency, backend work,
painting and user interaction latency. The 1,000-row workload is a stress case; normal
module lists ask the backend for one page. Run on an otherwise idle machine and record
the browser, viewport and hardware with the results. There is no timing threshold in CI,
whose shared runners cannot provide a stable rendering baseline.

## Recorded run

2026-10-03, Apple M1 Pro, an in-app Chromium 154 browser, 1075 × 859 viewport.
Raw measurements and the screenshot are local ignored artifacts under
`e2e/artifacts/m9-gaps/`.

| Workload | Mount | Median update | p95 update |
| --- | ---: | ---: | ---: |
| 50 table rows | 30.00 ms | 4.50 ms | 5.40 ms |
| 1,000 table rows | 206.50 ms | 77.90 ms | 90.20 ms |
| 50 rows, 50 data columns | 31.60 ms | 19.75 ms | 25.20 ms |
| 100 extra form properties | 11.80 ms | 3.40 ms | 3.70 ms |
| 1,000 menu entries | 42.00 ms | 11.85 ms | 13.50 ms |

The larger table creates and updates every cell; backend paging limits that work in the
module pages. This is one machine's baseline, rather than a cross-device performance
guarantee.

CI type-checks and builds the benchmark page so it stays usable as the packages change.
