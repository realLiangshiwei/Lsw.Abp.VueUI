# 扩展用户页面

修改已有模块页面时使用贡献者。本例增加显示姓名列和行操作，保留模块默认 CRUD 行为。

## 1. 定义贡献者

创建 `src/identity-options.ts`，内容如下。回调按 `IdentityUserDto` 约束类型；操作稍后执行，已经不在 setup 上下文中，因此通过 `data.getInjected` 获取服务。

<<< ../../examples/users-extension.ts

`displayLabel` 是派生展示列，不是后端 DTO 字段，所以没有启用服务端排序。行操作展示选中用户名，可替换成业务操作，必要时添加合适的 `permission`。

## 2. 传入延迟路由

```ts
import { lazyRoutes } from '@lsw-abpvue/core/router';
import { identityOptions } from './identity-options';

const identityRoute = lazyRoutes('/identity', () =>
  import('@lsw-abpvue/identity').then(module => module.createIdentityRoutes(identityOptions)),
);
```

启动时保留 `provideIdentityConfig()`，将 `identityRoute` 加入路由。打开 `/identity/users` 检查新列与操作，重新进入页面不应重复添加。

## 3. 其他扩展点

同一个选项对象支持新增字段、编辑字段与工具栏操作。贡献者在默认项和后端对象扩展之后执行，使用链表方法插入、删除或重新排序，见[页面扩展](/zh/concepts/extensions)。

自己的业务页面直接修改列和方法，无需注册贡献者。
