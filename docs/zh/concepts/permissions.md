# 权限

权限来自应用配置的 grantedPolicies，后端仍负责最终授权。

```ts
import { usePermission } from '@lsw-abpvue/core';
import { IdentityPolicyNames } from '@lsw-abpvue/identity/config';

const permission = usePermission();
const canCreate = permission.isGranted(IdentityPolicyNames.UsersCreate);
const reactiveCheck = permission.isGrantedRef(IdentityPolicyNames.UsersCreate);
```

布尔结果是当下快照，isGrantedRef 返回 ComputedRef。响应式模板也可以使用 AbpPermission：

```vue
<AbpPermission policy="AbpIdentity.Users.Create">
  <AbpButton @click="add">{{ $t('AbpIdentity::NewUser') }}</AbpButton>
</AbpPermission>
```

## 表达式与路由

支持 `A || B`、`A && B` 和括号，引用实际后端策略名。路由的 `meta.requiredPolicy` 同时用于访问守卫和菜单筛选，空分组会隐藏。

## 类型化名称

代理生成器输出权限常量，可通过扩展 `AbpKnownPolicyName` 接口收窄字符串类型。未扩展时接受普通字符串，便于应用逐步接入。

权限授予 UI 见[权限管理](/zh/modules/permission-management)。提供者 R、U、C 分别用于角色、用户、客户端，具体管理策略由后端决定。
