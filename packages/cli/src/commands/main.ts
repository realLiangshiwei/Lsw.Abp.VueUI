import { defineCommand } from 'citty';
import { addPackageCommand, ejectCommand } from './add-package.js';
import { newCommand } from './new.js';
import { proxyCommand } from './proxy.js';
import { switchUiCommand } from './switch-ui.js';

export const main = defineCommand({
  meta: {
    name: 'abpvue',
    description: 'The command line tool of the ABP Vue UI',
  },
  subCommands: {
    'add-package': addPackageCommand,
    eject: ejectCommand,
    new: newCommand,
    proxy: proxyCommand,
    'switch-ui': switchUiCommand,
  },
});
