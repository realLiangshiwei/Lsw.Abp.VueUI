# ABP 10.5.0

Captured on 2026-10-02 from a running BookStore host with the same entities and object
extensions as the main test backend. Every `Volo.Abp.*` framework assembly in its
`BookStore.HttpApi.Host.deps.json` resolves to 10.5.0.

To reproduce, copy `e2e/backend/BookStore` outside the workspace, change its ABP package
references from 10.6.0 to 10.5.0, and use LeptonXLite 5.5.0 instead of 5.6.0. Remove the
Studio client reference, module registration, configuration and logging sink: the
template's Studio client 3.0.9 requires ABP 10.6. The framework endpoints do not depend
on that client.

Use a separate MongoDB database, set the host's self URL and authority to port 44385,
then run the migrator and host from their project directories. Capture with:

```bash
ABP_BACKEND_URL=https://localhost:44385 ./scripts/capture-fixtures.sh --into e2e/fixtures/10.5.0
```

The JSON files come directly from that command. The framework DTO contracts and the
authenticated generated service calls were also checked against the running 10.5 host.
The proxy freshness check belongs to the main 10.6 backend, since that is the version
the checked-in proxy was generated from.
