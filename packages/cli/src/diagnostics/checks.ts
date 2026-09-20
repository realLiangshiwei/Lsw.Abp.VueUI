import * as prompts from '@clack/prompts';

export type CheckStatus = 'ok' | 'warn' | 'fail';

/** One diagnosed thing: what was looked at, how it came out, and what to do about it. */
export interface Check {
  name: string;
  status: CheckStatus;
  detail: string;
  /** The command or the edit that puts it right. */
  fix?: string | undefined;
}

const MARK: Record<CheckStatus, string> = { ok: '✔', warn: '⚠', fail: '✖' };

/** The report as `abpv doctor` prints it, and as `abpv new` prints its preflight. */
export function formatChecks(checks: readonly Check[]): string {
  const width = Math.max(...checks.map(check => check.name.length), 0);

  return checks
    .flatMap(check => [
      `${MARK[check.status]} ${check.name.padEnd(width)}  ${check.detail}`,
      ...(check.fix ? [`${' '.repeat(width + 4)}→ ${check.fix}`] : []),
    ])
    .join('\n');
}

export function printChecks(checks: readonly Check[]): void {
  const log = checks.some(check => check.status === 'fail') ? prompts.log.error : prompts.log.info;

  log(formatChecks(checks));
}

export const failed = (checks: readonly Check[]): Check[] =>
  checks.filter(check => check.status === 'fail');
