import type { EmittedFile } from './emit-models.js';

/**
 * One `index.ts` per directory, re-exporting the files in it and the directories under
 * it. Names are unique across the whole generation -- the registry saw to that -- so a
 * flat re-export is safe and an application can import everything from one place.
 * @param files Every file the generation produced
 */
export function emitBarrels(files: EmittedFile[]): EmittedFile[] {
  const children = new Map<string, Set<string>>();

  const ensure = (directory: string) => {
    if (!children.has(directory)) children.set(directory, new Set());
    return children.get(directory) as Set<string>;
  };

  ensure('');

  for (const file of files) {
    const segments = file.path.split('/');
    const name = segments.pop() as string;
    let directory = '';

    for (const segment of segments) {
      ensure(directory).add(`${segment}/index.js`);
      directory = directory ? `${directory}/${segment}` : segment;
      ensure(directory);
    }

    ensure(directory).add(name.replace(/\.ts$/, '.js'));
  }

  return [...children]
    .sort(([left], [right]) => (left < right ? -1 : 1))
    .map(([directory, entries]) => ({
      path: directory ? `${directory}/index.ts` : 'index.ts',
      content: `${[...entries]
        .sort()
        .map(entry => `export * from './${entry}';`)
        .join('\n')}\n`,
    }));
}
