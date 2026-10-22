---
'@lsw-abpvue/identity-pro': patch
'@lsw-abpvue/account-pro': patch
'@lsw-abpvue/audit-logging': patch
'@lsw-abpvue/account': patch
'@lsw-abpvue/core': patch
'@lsw-abpvue/components': patch
'@lsw-abpvue/theme-shared': patch
'@lsw-abpvue/theme-basic': patch
'@lsw-abpvue/setting-management': patch
'@lsw-abpvue/permission-management': patch
---

Use official backend localization resources throughout built-in interfaces. Remove
frontend translation fallbacks and custom explanatory messages while preserving
confirmation, recovery, authorization and uncertain-write protection.

Use existing field labels and accessible relationships for controls without an
official resource. Preserve backend error messages and keep technical diagnostics
out of interface text. Keep the public localization customization API compatible.
