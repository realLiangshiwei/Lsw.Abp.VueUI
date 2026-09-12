import { defineCommand } from 'citty';
import { proxyCommand } from './proxy.js';

export const main = defineCommand({
  meta: {
    name: 'abpvue',
    description: 'The command line tool of the ABP Vue UI',
  },
  subCommands: { proxy: proxyCommand },
});
