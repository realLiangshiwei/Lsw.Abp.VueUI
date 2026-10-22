---
'@lsw-abpvue/identity-pro': minor
'@lsw-abpvue/identity': minor
'@lsw-abpvue/cli': patch
'@lsw-abpvue/components': patch
'@lsw-abpvue/theme-basic': patch
---

Add Identity Pro user creation, editing and security operations for ABP 10.7.0,
with independent typed contributors, commercial proxies, role and organization
assignment, protected field serialization and Shared tenant/two-factor guards.
Preserve the existing Identity component keys and base role behavior.

Add a separately authorized user details dialog with 21 read-only information,
organization and audit values, fresh reads, missing-audit-user handling and retry.
Add 16 advanced filters alongside free-text search, dedicated role/OU lookups,
three-state flags, creation/modification ranges, explicit draft application and
filter preservation across sorting, paging and CRUD refreshes.

Allow record dialogs to include assignment changes in their unsaved-change state,
and add theme styling for the organization checklist. Restore select placeholders
for unset and cleared values while preserving false and zero selections. Preserve readonly array
request types when generating service proxies.
