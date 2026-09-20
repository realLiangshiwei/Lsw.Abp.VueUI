import { defineCommand } from 'citty';
import { newCommand } from './new.js';
import { proxyCommand } from './proxy.js';

export const main = defineCommand({
  meta: {
    name: 'abpvue',
    description: 'The command line tool of the ABP Vue UI',
  },
  subCommands: { new: newCommand, proxy: proxyCommand },
});
