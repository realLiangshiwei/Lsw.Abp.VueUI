---
'@lsw-abpvue/components': minor
'@lsw-abpvue/identity-pro': patch
'@lsw-abpvue/theme-basic': patch
'@lsw-abpvue/core': patch
---

Retire obsolete editor operations and pending delete confirmations when identity or
tenant context changes. Keep uncertain create retries tied to the inspected draft
and prevent late responses from closing or unlocking a newer form.
Requests explicitly aborted by their owner still reject without reporting obsolete
transport or validation failures to the current page.

Associate every confirmation with the theme's actual dialog title, including
message-only confirmations, using the shared accessible title context.
Keep page errors in an accessible modal layer above an active editor, preserve its
draft and return focus to an available control after dismissal.
Place breadcrumb separators and spacing in the document's inline direction for
both left-to-right and right-to-left cultures.
