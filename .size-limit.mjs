import { readFileSync } from 'node:fs';

const checks = JSON.parse(readFileSync(new URL('./.size-limit.json', import.meta.url), 'utf8'));

export default checks.map(check => ({
  ...check,
  ignore: check.ignore?.flatMap(path =>
    path.startsWith('./chunks/') ? [path, path.replace('./chunks/', './')] : [path],
  ),
  modifyEsbuildConfig: config => ({
    ...config,
    tsconfigRaw: { compilerOptions: {} },
    plugins: [
      ...(config.plugins ?? []),
      {
        name: 'published-inputs',
        setup(build) {
          build.onEnd(result => {
            const sources = Object.keys(result.metafile?.inputs ?? {}).filter(path =>
              /(?:^|[/\\])src[/\\]|\.vue$/.test(path),
            );
            return {
              errors: sources.map(path => ({ text: `Size measurement included source: ${path}` })),
            };
          });
        },
      },
    ],
  }),
}));
