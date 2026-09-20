import process from 'node:process';

interface Step {
  what: string;
  undo(): Promise<void>;
}

/**
 * What to take back if a command does not finish. Every step that creates something
 * records how to remove it, and an interrupt or a failure runs them in reverse -- the
 * point being that a command that stopped half way leaves nothing behind (design 08 §4, S7).
 */
export class Rollback {
  private readonly steps: Step[] = [];
  private detach: (() => void) | undefined;

  /**
   * @param what What the step did, for the message when it is taken back
   * @param undo How to take it back; it must not throw for something already gone
   */
  add(what: string, undo: () => Promise<void>): void {
    this.steps.push({ what, undo });
  }

  /** Runs the undos, newest first, and reports what was taken back. */
  async run(): Promise<string[]> {
    const undone: string[] = [];

    for (const step of [...this.steps].reverse()) {
      try {
        await step.undo();
        undone.push(step.what);
      } catch {
        // A rollback that fails half way still has the rest to do, and the message it
        // would print is less useful than the ones for the steps that worked.
      }
    }

    this.steps.length = 0;
    return undone;
  }

  /**
   * Runs the undos on Ctrl+C as well. The handler is removed when the command finishes,
   * so nothing outlives it.
   *
   * @param onInterrupt Told what was taken back, before the process leaves
   */
  watchInterrupts(onInterrupt: (undone: string[]) => void): void {
    const handler = (): void => {
      void this.run().then(undone => {
        onInterrupt(undone);
        process.exit(130);
      });
    };

    process.on('SIGINT', handler);
    this.detach = () => process.off('SIGINT', handler);
  }

  /** Keeps what was done: the command finished, so there is nothing to take back. */
  commit(): void {
    this.steps.length = 0;
    this.detach?.();
    this.detach = undefined;
  }
}
