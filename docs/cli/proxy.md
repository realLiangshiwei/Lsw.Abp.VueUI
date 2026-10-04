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
