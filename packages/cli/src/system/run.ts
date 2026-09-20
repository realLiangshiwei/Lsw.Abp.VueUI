import { spawn } from 'node:child_process';
import process from 'node:process';

export interface RunOptions {
  cwd?: string | undefined;
  /** Sends the child's output to this process as it arrives, for a command worth watching. */
  stream?: boolean | undefined;
  /**
   * Runs through the platform shell. Needed on Windows for anything installed as a `.cmd`
   * shim, which is every Node package manager.
   */
  shell?: boolean | undefined;
}

export interface RunResult {
  /** `null` when the process was killed by a signal rather than exiting. */
  code: number | null;
  output: string;
}

/**
 * Runs another program and waits for it. Failure is a result, not an exception: what to
 * do about `abp` exiting non-zero is the caller's decision.
 *
 * @param command The program
 * @param args Its arguments, passed as they are -- no shell parsing unless asked for
 * @param options Where to run it and whether its output should be visible
 */
export function run(
  command: string,
  args: readonly string[],
  options: RunOptions = {},
): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, [...args], {
      cwd: options.cwd,
      shell: options.shell ?? false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let output = '';
    for (const stream of [child.stdout, child.stderr]) {
      stream.setEncoding('utf8');
      stream.on('data', (chunk: string) => {
        output += chunk;
        if (options.stream) process.stdout.write(chunk);
      });
    }

    child.on('error', reject);
    child.on('close', code => resolve({ code, output }));
  });
}

/** Whether a program is on the PATH, and what it says its version is. */
export async function versionOf(command: string, args: readonly string[]): Promise<string | null> {
  try {
    const { code, output } = await run(command, args);

    return code === 0 ? output.trim() : null;
  } catch {
    // Not installed, or not executable: the caller says what to do about it.
    return null;
  }
}
