---
'@lsw-abpvue/identity-pro': minor
'@lsw-abpvue/core': minor
'@lsw-abpvue/cli': patch
---

Add Identity Pro Excel and CSV exports that preserve the applied user filters and
sorting across all matching records. Add administrative search by user ID, username
or email, opening fresh read-only details with permission checks, retry and cancellation.

Add `WindowService.downloadBlob` for browser downloads with object URL cleanup and
server-safe behavior. Encode generated service path parameters once with
`encodeURIComponent(String(value))` to preserve reserved characters as one path segment.
