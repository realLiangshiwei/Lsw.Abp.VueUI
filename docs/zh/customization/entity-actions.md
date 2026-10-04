# 实体操作扩展

行操作贡献者修改内置菜单。多个可见操作显示为下拉菜单，单个操作显示为按钮，没有可见操作时不显示控件。

## 替换一个操作

本例替换编辑操作，仅对启用的用户显示。这是示例业务规则，不是 Identity 默认编辑策略。

<<< ../../examples/user-actions.ts

## 注册到模块路由

将示例保存为 `src/identity-options.ts`，在 `src/routes.ts` 使用导出的选项：

~~~ts
import { lazyRoutes } from '@lsw-abpvue/core/router';
import { userActions } from './identity-options';

const identityRoute = lazyRoutes('/identity', () =>
  import('@lsw-abpvue/identity').then(module => module.createIdentityRoutes(userActions)),
);
~~~

将 `identityRoute` 放入应用路由数组，并保留启动时的 `provideIdentityConfig()`。替换已有 identity 路由，不要为同一前缀注册两份路由。模块配置改变后重启开发服务，再打开 `/identity/users`。


## 理解回调

`EntityAction<IdentityUserDto>` 接收 `PropData<IdentityUserDto>`，`data.record` 是当前行。通过 `data.getInjected(USERS_PAGE)` 获取内置用户页面提供的命令，再调用 `edit`，保留原来的忙碌状态、DTO 读取和对话框流程。

默认编辑标签是 `AbpUi::Edit`。删除时匹配 key，不匹配翻译后的文字；不删除原操作会同时出现两个编辑操作。

`permission` 和 `visible` 必须同时满足。`visible` 可能在没有行记录时被调用，应保护可选的 `data`。`icon` 使用应用的图标类；`showOnlyIcon` 仍需要可访问的本地化标签。

## 执行自定义请求

在回调中通过 `data.getInjected` 获取服务。例如获取生成服务，使用 `ConfirmationService` 确认，再等待请求完成。端点、权限和 DTO 必须由自己的后端提供。

回调可以返回 Promise，但表格不会自动为所有自定义操作管理忙碌状态。重复点击保护应放在页面拥有的命令或状态中，修改成功后明确刷新列表查询。

## 替换页面中的操作

完整替换的页面如果渲染默认操作贡献者，需要自行提供 `USERS_PAGE` 命令。路由注入器不会为任意替换页面实现这些命令。[包装原页面](/zh/customization/replacement)可以保留原来的命令提供者。

## 检查效果

分别检查启用用户、停用用户和缺少 `AbpIdentity.Users.Update` 的登录用户。确认编辑只出现一次，打开原编辑对话框，服务端仍然执行授权。

相关内容见[扩展行为与默认值](/zh/customization/extension-behavior)。

## 打开自定义详情对话框

创建 src/user-details.ts 与 src/components/UsersPageWithDetails.vue，并调整后者的服务导入。服务先读取完整 Identity 用户，再打开只读对话框，请求期间阻止重复点击。

<<< ../../examples/user-details.ts

<<< ../../examples/UsersPageWithDetails.vue

将 userDetails 传给已有 createIdentityRoutes(userDetails) 懒加载路由，再在模块启动后注册包装替换：

```ts
import { inject, provideAppInitializer, ReplaceableComponentsService } from '@lsw-abpvue/core';
import { IdentityComponents } from '@lsw-abpvue/identity';
import UsersPageWithDetails from './components/UsersPageWithDetails.vue';

export const detailsPage = provideAppInitializer(() => {
  inject(ReplaceableComponentsService).add({ key: IdentityComponents.Users, component: UsersPageWithDetails });
});
```

启动 providers 加入 detailsPage，资源增加 BookStore::Details。贡献器与包装解析同一个根服务。直接导入的 UsersPage 保留默认命令与扩展渲染。示例使用包内 Identity 详情代理，没有假定新的业务端点。

## 添加、删除与顺序

addHead/addTail 放在首尾，addBefore/addAfter 用谓词定位相对位置。删除匹配稳定 text key，不匹配翻译文字。替换可能重复的项时先 dropByValueAll。锚点不存在时相对插入可能失败，模块默认项不同的场景应准备后备位置。

不能用 clearContributors 删除一个按钮，它会清空整个贡献器容器。保留模块默认值，再删除最终列表中要替换的项。分别在两条记录上检查，避免操作错误地沿用之前选择。
