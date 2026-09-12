/** One thing the generator decided that a person may want to look at. */
export interface ReportEntry {
  kind: ReportKind;
  message: string;
}

export type ReportKind =
  /** Two types with one name; one of them was renamed. */
  | 'renamed'
  /** A type nothing could be made of, generated as `unknown`. */
  | 'unresolved'
  /** A validation attribute with no client-side equivalent. */
  | 'unmapped-attribute'
  /** Two actions with one method name; one of them got a longer one. */
  | 'renamed-method'
  /** Something the backend says that the generator cannot honour. */
  | 'skipped';

/** What the generation says about itself; printed at the end of a run. */
export class GenerationReport {
  readonly entries: ReportEntry[] = [];

  add(kind: ReportKind, message: string): void {
    // The same decision is reached once per reference, and saying it once is enough.
    if (this.entries.some(entry => entry.kind === kind && entry.message === message)) return;

    this.entries.push({ kind, message });
  }

  of(kind: ReportKind): string[] {
    return this.entries.filter(entry => entry.kind === kind).map(entry => entry.message);
  }

  get isEmpty(): boolean {
    return this.entries.length === 0;
  }
}
