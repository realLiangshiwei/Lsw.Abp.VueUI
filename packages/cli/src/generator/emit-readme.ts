import type { EmittedFile } from './emit-models.js';

const README = `# Generated proxy

\`abpvue proxy add\` wrote this directory from what the backend describes at
\`/api/abp/api-definition\`. Running the command again replaces everything in it, so keep
your own code somewhere else.

\`generate-proxy.json\` records which modules were generated and with which options.
\`abpvue proxy refresh\` reads it; deleting it only means the next refresh has to be told
the modules again.

Check the directory in. A change here in a pull request is a change in the backend's API,
and that is worth seeing.

Two things worth configuring once:

- exclude the directory from your linter. The code here says what the backend says --
  enums included -- rather than what your rules prefer.
- leave it out of your formatter too, or let it be: the generator already formats what it
  writes with your own Prettier configuration.
`;

/** The note that says what this directory is and who overwrites it. */
export function emitReadme(): EmittedFile {
  return { path: 'README.md', content: README };
}
