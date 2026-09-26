# The abpv CLI

```bash
npx @lsw-abpvue/cli <command>
```

Both `abpv` and `abpvue` run it. Node 20 or newer; the .NET SDK and the official ABP CLI
are needed only by `new` and `switch-ui`.

| Command | |
| --- | --- |
| [`new`](./new) | A whole solution: the backend by the official `abp`, the frontend by this |
| [`switch-ui`](./switch-ui) | Add or swap in a Vue UI in a solution that already exists |
| [`proxy`](./proxy) | Typed services, DTOs, validators and permission names from a running backend |
| [`generate`](./generate) | A CRUD page for one of your entities |
| [`add-package`](./add-package) | Install a module UI, optionally with its source |
| [`create-lib`](./create-lib) | Scaffold the UI package of a third-party module |
| [`doctor`](./doctor) | Diagnose the ten usual "it cannot talk to the backend" mismatches |
| [`update`](./update) | Move the project's packages to a newer version |

Every command that writes takes `--dry-run`, and says what it would do.

## Running it from a project

```bash
cd vue
npx abpv doctor
```

The CLI is a dependency of a project `abpv new` created, so `npx abpv` inside it runs the
version that project was built with rather than whatever npm has today.
