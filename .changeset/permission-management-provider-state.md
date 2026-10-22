---
'@lsw-abpvue/permission-management': patch
---

Cancel obsolete permission requests when the provider, visibility or identity context
changes. Prevent saving before a successful read, expose safe read and write failures,
and discard late responses without closing a different provider's dialog.
