---
'@lsw-abpvue/cli': patch
---

Preserve nullable method parameters in generated service signatures independently of
whether the argument is optional. Role and organization member migration can pass
null to remove assignments without inventing an empty identifier.

Keep opaque extra-property query parameters named, matching ABP Angular 10.7, while
continuing to expand actual CLR dictionary parameters.
