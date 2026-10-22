---
'@lsw-abpvue/core': patch
'@lsw-abpvue/cli': patch
'@lsw-abpvue/components': patch
'@lsw-abpvue/identity-pro': patch
'@lsw-abpvue/account-pro': patch
'@lsw-abpvue/oauth': patch
'@lsw-abpvue/audit-logging': patch
'@lsw-abpvue/tenant-management': patch
---

Generate Core framework services and DTOs from API metadata, preserving complete
configuration state and encoding tenant lookup paths. Support a local Core import
when generating framework proxies and retain that option during refresh.

Derive Identity Pro and CLI extension types from generated DTOs. Call account
settings and picture proxies directly without forwarding services.

Refresh tenant path encoding, multipart user import types, and audit export byte collections from the original backend metadata.
