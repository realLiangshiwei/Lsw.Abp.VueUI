# The abpv CLI

Install the alpha CLI globally, or run it without a global installation:

```bash
npm install -g @lsw-abpvue/cli@alpha
npx @lsw-abpvue/cli@alpha --help
```

`abpv` and `abpvue` invoke the same command. The CLI requires Node 20 or newer. Creating a backend requires the target .NET SDK and official ABP CLI. Existing-solution operations also inspect backend configuration; online generation needs a running backend or saved metadata.

| Command | Purpose |
| --- | --- |
| [new](./new) | Create an ABP backend and Vue frontend |
| [switch-ui](./switch-ui) | Add Vue to an existing solution |
| [proxy](./proxy) | Generate typed services, DTOs, validators and policy names |
| [generate](./generate) | Generate an ordinary application CRUD page |
| [add-package](./add-package) | Install a package or release its source locally |
| [eject](./eject) | Alias for releasing package source |
| [create-lib](./create-lib) | Scaffold a reusable module UI package |
| [doctor](./doctor) | Diagnose environment and backend configuration |
| [update](./update) | Update ABP Vue package versions |

## Project commands

The generated frontend includes the CLI as a dependency. Run `pnpm abpv <command>` from `vue/` to use that project's version. Mutating commands support `--dry-run`; `doctor` only reads and reports. Use `<command> --help` for the installed version's options.

See [configuration and generated files](./configuration) for metadata, previews, backups and overwrite behavior.
