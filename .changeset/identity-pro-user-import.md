---
'@lsw-abpvue/identity-pro': minor
---

Add Excel and CSV user import with server templates, multipart uploads, result counts
and failed record downloads. Preserve import results when refreshing the user list
fails, and retry that read independently. Guard duplicate uploads, confirm retries
after uncertain writes, and cancel obsolete requests when permission or context changes.
