import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export interface SolutionFixtureOptions {
  /** Where the host serves, for a test that wants a backend it can actually answer with. */
  hostUrl?: string | undefined;
  separateAuthServer?: boolean | undefined;
  /** Writes an `angular/` directory, the way `abp new -u angular` does. */
  generatedUi?: string | undefined;
}

const launchSettings = (name: string, url: string) => ({
  iisSettings: { iisExpress: { applicationUrl: url, sslPort: 44335 } },
  profiles: {
    'IIS Express': { commandName: 'IISExpress', launchBrowser: true },
    [name]: { commandName: 'Project', applicationUrl: url },
  },
});

/**
 * What `abp new Acme.BookStore -t app -u no-ui -uost -d mongodb -csf` writes, cut down to
 * the files the CLI reads. The two absences are the point: the `_App` client has no
 * `RootUrl` and `App` has no `CorsOrigins` (design 08 §3).
 *
 * @param root Where to write it
 * @param options The shapes a solution can come in
 */
export async function writeSolutionFixture(
  root: string,
  options: SolutionFixtureOptions = {},
): Promise<void> {
  const project = async (name: string, files: Record<string, unknown>): Promise<void> => {
    for (const [path, content] of Object.entries(files)) {
      const file = join(root, 'src', `Acme.BookStore.${name}`, path);
      await mkdir(join(file, '..'), { recursive: true });
      await writeFile(file, `${JSON.stringify(content, null, 2)}\n`, 'utf8');
    }
  };

  const hostUrl = options.hostUrl ?? 'https://localhost:44335';

  await mkdir(root, { recursive: true });
  await writeFile(join(root, 'Acme.BookStore.slnx'), '<Solution />\n', 'utf8');

  await project('DbMigrator', {
    'appsettings.json': {
      ConnectionStrings: { Default: 'mongodb://localhost:27017/BookStore' },
      OpenIddict: {
        Applications: {
          BookStore_App: { ClientId: 'BookStore_App' },
          BookStore_Swagger: { ClientId: 'BookStore_Swagger', RootUrl: 'https://localhost:44335/' },
        },
      },
    },
  });

  await project('HttpApi.Host', {
    'appsettings.json': {
      App: { SelfUrl: hostUrl, HealthCheckUrl: '/health-status' },
      AuthServer: { Authority: hostUrl },
    },
    'Properties/launchSettings.json': launchSettings('Acme.BookStore.HttpApi.Host', hostUrl),
  });

  // The one file the CLI must never touch, whatever else it does (design 08 §4, S4).
  await writeFile(
    join(root, 'src', 'Acme.BookStore.HttpApi.Host', 'BookStoreHttpApiHostModule.cs'),
    'public class BookStoreHttpApiHostModule { }\n',
    'utf8',
  );

  if (options.separateAuthServer) {
    await project('AuthServer', {
      'appsettings.json': { App: { SelfUrl: 'https://localhost:44336' } },
      'Properties/launchSettings.json': launchSettings(
        'Acme.BookStore.AuthServer',
        'https://localhost:44336',
      ),
    });
  }

  if (options.generatedUi) {
    const ui = join(root, options.generatedUi);
    await mkdir(join(ui, 'src'), { recursive: true });
    await writeFile(join(ui, 'angular.json'), '{}\n', 'utf8');
  }
}
