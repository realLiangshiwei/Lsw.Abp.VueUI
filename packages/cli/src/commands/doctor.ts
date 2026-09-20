import { isAbsolute, resolve } from 'node:path';
import process from 'node:process';
import * as prompts from '@clack/prompts';
import { defineCommand } from 'citty';
import { failed, printChecks } from '../diagnostics/checks.js';
import { runDoctor, type DoctorResult } from '../diagnostics/doctor.js';
import { isUserFacingError } from '../errors.js';

/** The options of `abpv doctor`. */
export interface DoctorArgs {
  cwd?: string | undefined;
  solution?: string | undefined;
  token?: string | undefined;
  offline?: boolean | undefined;
}

export async function runDoctorCommand(args: DoctorArgs): Promise<DoctorResult> {
  const project = args.cwd ?? process.cwd();
  const solution =
    args.solution && (isAbsolute(args.solution) ? args.solution : resolve(project, args.solution));

  return runDoctor({ project, solution, token: args.token, offline: args.offline });
}

export const doctorCommand = defineCommand({
  meta: { name: 'doctor', description: 'Diagnose why the frontend and the backend disagree' },
  args: {
    solution: { type: 'string', description: 'The solution root; found upwards when absent' },
    token: { type: 'string', description: 'Access token, which completes the permission names' },
    offline: { type: 'boolean', description: 'Skip everything that needs the backend' },
  },
  run: async ({ args }) => {
    try {
      const { checks } = await runDoctorCommand(args as unknown as DoctorArgs);
      printChecks(checks);

      if (failed(checks).length > 0) process.exit(1);
    } catch (error) {
      if (!isUserFacingError(error)) throw error;

      prompts.log.error(error.message);
      process.exit(1);
    }
  },
});
