# When it does not work

```bash
abpv doctor
abpv doctor --token "$ACCESS_TOKEN"   # also compares the permission names
abpv doctor --offline                 # only what can be told without the backend
```

Nearly every "the frontend cannot talk to the backend" is one of a handful of mismatches,
and all of them are mechanically checkable. Every failure prints the command that fixes
it.

| Check | What it means when it fails |
| --- | --- |
| Environment | Node, the package manager, the .NET SDK, the ABP CLI |
| Backend reachable | `GET {api}/api/abp/application-configuration` |
| Certificate | The development certificate is not trusted: `dotnet dev-certs https --trust` |
| CORS | Your origin is not in `CorsOrigins` on the host that answers |
| OpenIddict client | The identity server's discovery document, and whether it knows your `clientId` |
| Redirect URI | Your configured `redirectUri` is not among the client's `RedirectAllowedUrls` |
| Versions | Which ABP the solution was generated for, against what this release is tested with |
| Proxy freshness | The generation is run again in memory and compared file by file |
| Object extension coverage | The backend declares N extension properties and the mapping rules recognise M |
| Released source | Which packages no longer follow releases |

## The object extension line

Fifteen rules turn a property the backend declares into a column and a form field.
Missing any one of them looks exactly like a mistake in your own configuration — the
property is configured, and nothing shows. So `doctor` puts both numbers next to each
other and names the difference:

```
⚠ object extensions   backend 9, recognised 8
                      not recognised: IdentityUser.HireDate (DateTime?, hidden on the table)
                      → this is a gap in our mapping rules; please open an issue
```

If it names a property, it is our bug, not yours.

## The usual first-run ones

| | |
| --- | --- |
| A blank page and a network error | The backend is not running, or the certificate is not trusted |
| Backend requests return 500 with "The Libs Folder is Missing" | Run `abp install-libs` from the backend solution's root, then restart its host |
| Sign-in loops back to the login page | The redirect URI does not match what the OpenIddict client was seeded with. `abpv switch-ui --port <yours>`, then run the DbMigrator again |
| Every request is 401 after switching tenants | Expected once: the token was minted for the other tenant and is discarded. If it keeps happening, the tenant's own client is not seeded |
| The menu is empty after signing in | The user has no permissions, or `application-configuration` is being served from cache. Hard reload |
| A column the backend configured does not show | `abpv doctor` and read the object extension line |

## Asking for help

Open an issue with the output of `abpv doctor` in it. It says what the toolchain is, what
the project thinks its backend is, and which check failed — which is most of what anyone
would ask you for anyway.
