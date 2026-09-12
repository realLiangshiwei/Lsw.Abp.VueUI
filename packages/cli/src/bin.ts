import process from 'node:process';
import { runMain } from 'citty';
import { main } from './commands/main.js';
import { isUserFacingError } from './errors.js';

runMain(main).catch((error: unknown) => {
  if (!isUserFacingError(error)) throw error;

  console.error(error.message);
  process.exit(1);
});
