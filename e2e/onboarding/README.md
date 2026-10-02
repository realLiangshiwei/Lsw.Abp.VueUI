# M9 newcomer trials

The user withdrew the two-participant, 30-minute acceptance requirement on 2026-10-02.
The procedure below is retained for optional future usability work and is no longer
an M9 release gate.

The original criterion asked two ABP users who had not worked on this project to get it
running from the documentation within 30 minutes each. The automated checks and the
agent-operated trials are technical verification records. Keep generated records and
screenshots in the local `results/` directory, which is ignored by Git.

## Prepare the trial

- Use the same candidate commit and documentation revision for both participants.
- Install the prerequisites listed in [A new solution](../../docs/guide/new-solution.md)
  before timing starts. Record the OS, tool versions and this preparation.
- Give each participant a clean directory and a separate database. For the existing
  solution trial, provide a working ABP BookStore backend with its Book API and seed data.
- Before publication, provide the candidate packages through a local package feed.
  Record this installation source; it does not verify installation from public npm.
- Give participants the guides and candidate installation instructions. Do not provide
  additional commands or a completed Vue project.

## Tasks

| Participant | Starting point | Documentation | Finish condition |
| --- | --- | --- | --- |
| A | Empty directory | [A new solution](../../docs/guide/new-solution.md) | Create a solution with the Books sample, start both hosts, sign in and display the seeded Books list |
| B | Working BookStore backend without this Vue UI | [An existing solution](../../docs/guide/existing-solution.md), then [A CRUD page](../../docs/guide/crud-page.md) | Add Vue, generate the Book page, start it, sign in and display the seeded Books list |

Start the timer when the participant starts reading the task documentation. Stop it
when the authenticated user and Book rows are visible. Include downloads, errors,
restarts and time spent troubleshooting. Record elapsed time at 30 minutes even if the
participant continues afterwards.

Observe without giving steps. Record questions, errors and the documentation section
that caused confusion. If help is needed, record its time and content; do not report
that attempt as an independent success. Fix the cause and arrange a fresh trial with
someone who has not learned the corrected path.

## Record the result

For each participant, retain:

- Candidate commit, documentation revision and installation source.
- OS, tool versions, backend version and prepared prerequisites.
- Start time, finish time, elapsed seconds and whether help was needed.
- Commands, errors, confusing steps and fixes required.
- A screenshot showing the authenticated user and Books list.

If this optional trial is run, report whether each independent attempt succeeded within
1,800 seconds. A local-feed trial must remain labelled as such; public package
installation is a separate release check.

| Participant | Date | Candidate | Elapsed | Help needed | Result |
| --- | --- | --- | --- | --- | --- |
| A | Pending | Pending | Pending | Pending | Pending |
| B | Pending | Pending | Pending | Pending | Pending |
