# abpv proxy

```bash
abpv proxy add --module app     # one module, several, or "all"
abpv proxy refresh                   # generate again what is recorded
abpv proxy remove --module app  # take one out, generate the rest again
```

| | |
| --- | --- |
| `--module <name>` | Comma separated, or `all` |
| `--target <dir>` | Default `src/proxy` |
| `--url <backend>` | Default: `public/dynamic-env.json`, then `VITE_API_URL` |
| `--source <file>` | A saved `api-definition.json`, for working offline |
| `--config-source <file>` | A saved `application-configuration.json`, alongside `--source` |
| `--token <token>` | For a backend that does not answer anonymously, and for the permission names |
| `--insecure` | Accept the development certificate a local ABP backend serves |
| `--service-type <t>` | `application` (default), `integration`, `all` |
| `--root-namespace <ns>` | Taken off the front of the generated directories |
| `--api-name <name>` | Overrides the module's remote service name |
| `--no-index` | No barrel files |
| `--no-validators` / `--no-policy-names` | Leave those out |
| `--dry-run` | Say what would change and write nothing |

`generate-proxy.json` records what was generated and with which options, which is what
`refresh` replays. Deleting it only means the next refresh has to be told the modules
again.

## What it writes

DTOs as interfaces, one service per controller, a validator map per namespace, the
permission names as constants, and a barrel per directory. See
[Talking to the backend](../guide/backend).

## Built-in modules

Import built-in services from package `/proxy` entry points. Generate application proxies for your business API, or generate a specific module only when deliberately maintaining its proxy yourself. Methods return promises; cancellation uses an AbortSignal.

## Online generation workflow

From the frontend directory, verify public/dynamic-env.json points to the running backend. Run `abpv proxy add --module app --insecure` only for a development server whose self-signed certificate requires it. Inspect src/proxy/generate-proxy.json and the generated services/DTOs. Then use proxy refresh for subsequent changes.

--insecure affects CLI retrieval; it does not change the browser's certificate trust or production TLS. --module refers to api-definition module ids; a project name and module id are not necessarily identical.

## Reproduce without a running backend

Store two valid JSON responses locally: api-definition.json and application-configuration.json from the same backend version/session. Then run:

```bash
abpv proxy add --module app --source ./api-definition.json --config-source ./application-configuration.json
abpv proxy refresh --source ./api-definition.json --config-source ./application-configuration.json --dry-run
```

Review the dry-run diff before writing. Saved configuration can contain user/session metadata, so keep only appropriate fixtures in source control. Never save an access token alongside the metadata.

## Common failures

| Failure | Next check |
| --- | --- |
| Connection/certificate error | Backend URL, host startup, certificate; use insecure only for local development |
| Module not found | Actual api-definition modules keys |
| Missing business service | API exposure, service-type filter and selected module |
| Import changed after refresh | root-namespace, generated name collisions and barrel exports |
| Missing policies | Authenticated configuration supplied to the generator |

Do not hand-edit output to compensate for a wrong input definition. Fix metadata/options and regenerate. Use [doctor](/cli/doctor) and [proxy guide](/guide/backend) for consumer checks.
