# Bootstrap UI review

The 2026-10-02 results record a browser review of the running playground and component
tests for the shared modal behavior. They are technical verification, not independent
human usability trials. Package publication is paused at the user's request.

## Reproduce the browser review

1. Start the test backend and playground, then sign in with the test administrator.
2. Open Roles at a width above 992px. Collapse the sidebar and verify the content fills
   the available width. Reopen it and verify the selected route is visible.
3. Open Language and the current-user menu. Verify their end edges align with their
   triggers and the lists remain inside the viewport. Press End in the language menu
   and verify the focused item scrolls into view. Repeat at 390px width and in Arabic.
4. Open the administrator role's Permissions dialog. Select Identity management,
   inspect the group counts and inherited grants, and scroll the permission list.
   Verify its heading remains visible while the tree scrolls. Cancel without saving.
   Repeat in light and dark themes, then use the group selector at 390px width.
   Filter for an unmatched term and verify the empty-state message. Restore English.
5. Open Settings. Inspect Emailing and Time Zone, switch tabs with arrow keys and
   Home/End, and check Arabic RTL and the single-column mobile form. Restore English.
6. Open New role and enter a disposable name. Request a close with Cancel, Close,
   Escape and by clicking outside the content. Reject the confirmation and verify the
   value remains. Confirm the discard and verify focus returns to New role.
7. Reopen New role without entering anything. Cancel should close immediately.

The review creates no entities, saves no permission or settings changes, and sends no
test email. Native beforeunload prevention and listener cleanup are covered by both
theme contract suites. Reset temporary viewport overrides after reviewing.

The JSON records list the screenshots and verification results. The menu-permissions
record covers the follow-up alignment fix and the refined permission layout. The permission and
feature dialogs retain ABP's explicit suppression of unsaved changes warnings.
