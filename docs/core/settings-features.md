# Settings and features

The read services use application configuration and return reactive values. They do not save changes to the backend.

```ts
import { useFeature, useSetting } from '@lsw-abpvue/core';

const setting = useSetting();
const feature = useFeature();
const culture = setting.get('Abp.Localization.DefaultLanguage');
const enabled = feature.isEnabled('BookStore.Printing');
const quota = feature.get('BookStore.PrintingQuota');
```

## Values and conditions

| API | Result |
| --- | --- |
| `setting.get(name)` | Computed string or undefined |
| `setting.getBoolean(name)` | Computed boolean |
| `setting.getAll(keyword?)` | Computed settings record, optionally filtered |
| `feature.get(name)` | Computed string or undefined |
| `feature.isEnabled(name)` | Computed boolean feature condition |
| `feature.isGlobalEnabled(name)` | Computed global feature condition |

Feature values can represent booleans, quotas or selections. Read a numeric quota as a string first and convert according to your business contract. A missing value and zero are different states.

## Saving values

Use [Setting management](/modules/setting-management) and [Feature management](/modules/feature-management), or your own typed backend services, to write values. Refresh application configuration after a custom save that changes the current session's effective settings or features.

Permissions and features are separate conditions: an enabled feature does not grant access to an operation.
