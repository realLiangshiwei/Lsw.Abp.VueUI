import vue from '@vitejs/plugin-vue';
import { defineConfig, loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

/** API and OAuth back-channel requests stay on the frontend's development origin. */
const BACKEND_PATHS = ['/api', '/connect', '/.well-known', '/getEnvConfig', '/Abp'];

/** Where the dev server listens: the port of the URL the application is served from. */
function portOf(url: string): number {
  const port = /:(\d+)/.exec(url)?.[1];

  return port ? Number(port) : 4200;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const api = env.VITE_API_URL || '__API_URL__';
  const auth = env.VITE_AUTH_URL || '__AUTH_URL__';
  const app = env.VITE_APP_URL || '__APP_URL__';

  return {
    plugins: [
      vue(),
      // Reads the `paths` of tsconfig.json, which is where a package released with
      // `abpv add-package --with-source-code` is picked up from (design 08 §5).
      tsconfigPaths(),
    ],
    build: {
      // The renewal iframe has a page of its own, and only the entry points named here
      // end up in the build.
      rollupOptions: { input: { main: 'index.html', 'silent-renew': 'silent-renew.html' } },
    },
    server: {
      port: portOf(app),
      proxy: Object.fromEntries(
        BACKEND_PATHS.map(path => [
          path,
          // The backend serves the ASP.NET development certificate, which Node does not
          // trust; the browser never sees it through here.
          {
            target: path === '/connect' || path === '/.well-known' ? auth : api,
            changeOrigin: true,
            secure: false,
          },
        ]),
      ),
    },
  };
});
