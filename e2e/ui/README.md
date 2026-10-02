# Bootstrap UI review

The 2026-10-02 results record a browser review of the running playground and component
tests for the shared modal behavior. They are technical verification, not independent
human usability trials. Package publication is paused at the user's request.

## Reproduce the browser review

1. Start the test backend and playground, then sign in with the test administrator.
2. Open Roles at a width above 992px. Collapse the sidebar and verify the content fills
   the available width. Reopen it and verify the selected route is visible.
3. Open the administrator role's Permissions dialog. Select Identity management,
   inspect the group counts and inherited grants, and scroll the permission list.
   Cancel without saving. Repeat in light and dark themes, then at 390px width.
4. Open Settings. Inspect Emailing and Time Zone, switch tabs with arrow keys and
   Home/End, and check Arabic RTL and the single-column mobile form. Restore English.
5. Open New role and enter a disposable name. Request a close with Cancel, Close,
   Escape and by clicking outside the content. Reject the confirmation and verify the
   value remains. Confirm the discard and verify focus returns to New role.
6. Reopen New role without entering anything. Cancel should close immediately.

The review creates no entities, saves no permission or settings changes, and sends no
test email. Native beforeunload prevention and listener cleanup are covered by both
theme contract suites. Reset temporary viewport overrides after reviewing.

The JSON record lists the screenshots and verification results. The permission and
feature dialogs retain ABP's explicit suppression of unsaved changes warnings.
