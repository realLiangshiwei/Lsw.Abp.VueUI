# CLI configuration and generated files

Run project commands from the frontend directory. Solution-aware commands also discover the backend from the standard `aspnet-core/` + `vue/` layout or an existing flat backend layout.

| File | Used for |
| --- | --- |
| `public/dynamic-env.json` | Backend, authentication server and frontend addresses |
| `package.json` | Package versions, package manager and `abpVue.autoImports` |
| `src/proxy/generate-proxy.json` | Selected modules and proxy-generation options |
| `.abpvue/source-code.json` | Locally released package source and recorded version |
| `src/routes.ts` | Application route insertion by `generate` |

Commit the business proxy and its generation metadata so API changes are reviewable. Generated automatic-import declaration files can be recreated by Vite. Do not place authentication secrets in runtime configuration.

## Preview and overwrite

Mutating commands support `--dry-run`; `doctor` is a diagnostic command. Preview before applying a conversion to an existing solution. `switch-ui` shows text diffs, renames and binary file changes, and preserves existing backup names. `--force` permits a dirty working tree for that command.

`generate --force` has a different meaning: it replaces the entire generated page. Proxy refresh rebuilds the recorded generated files. Keep business customization outside proxy output.

## Reproducibility

Use the project's installed CLI and an explicit package version or release tag when creating a project. Offline proxy generation uses `--source` plus optional `--config-source`. `--help` on each command displays its current options; backend options passed through `new` belong to the official ABP CLI.
