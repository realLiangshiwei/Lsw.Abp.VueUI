import { defineCommand } from 'citty';
import { newCommand } from './new.js';
import { proxyCommand } from './proxy.js';
import { switchUiCommand } from './switch-ui.js';

export const main = defineCommand({
  meta: {
    name: 'abpvue',
    description: 'The command line tool of the ABP Vue UI',
  },
  subCommands: { new: newCommand, proxy: proxyCommand, 'switch-ui': switchUiCommand },
});
