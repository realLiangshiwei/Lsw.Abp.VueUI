---
'@lsw-abpvue/identity-pro': minor
'@lsw-abpvue/account-pro': minor
'@lsw-abpvue/audit-logging': minor
'@lsw-abpvue/core': minor
'@lsw-abpvue/oauth': minor
---

Add organization units, security logs, user sessions, identity settings, invitation
and external-user workflows to Identity Pro, with optional entity history and
Identity-facing Account Pro integrations.

Introduce verified custom authentication grants that synchronize OIDC users,
tokens, tenant configuration and permissions, retire superseded session work,
and protect cross-document synchronization and HTTP retries across identity changes.
Clear the previous identity even when anonymous configuration is unavailable.

Preserve unrelated settings and current external-provider secrets, require fresh
reads after uncertain writes, and refresh effective permissions after changes to
the current operator's assignments. All packages use existing MIT workspace peers;
no additional third-party runtime dependency is introduced.
