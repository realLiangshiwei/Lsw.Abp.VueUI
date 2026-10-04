# 扩展用户页面

给内置 Identity UI 添加派生姓名列和行操作，保留默认 CRUD 行为。先确保应用能够登录并访问 `/identity/users`。

## 1. 创建贡献者文件

创建 `src/identity-options.ts`：

<<< ../../examples/users-extension.ts

`displayLabel` 是前端派生字段，没有启用服务端排序。行操作通过共享 Toaster 服务显示选中的用户名。

回调会在 setup 外执行，通过 `data.getInjected` 获取页面扩展上下文中的服务。

## 2. 注册延迟路由

在 `src/routes.ts` 中：

~~~ts
import { lazyRoutes } from '@lsw-abpvue/core/router';
import { identityOptions } from './identity-options';

const identityRoute = lazyRoutes('/identity', () =>
  import('@lsw-abpvue/identity').then(module => module.createIdentityRoutes(identityOptions)),
);
~~~

用该路由替换已有 identity 路由，并保留在导出的路由数组中。启动提供者保留 `provideIdentityConfig()`。同一前缀注册两份延迟路由，会使实际选项来源不清楚。

## 3. 添加本地化

派生列使用已有 Identity 标签。业务操作文字添加到后端资源或 `withLocalizations`，见[本地化](/zh/concepts/localization)。示例通知以用户名作默认文本，没有可选 BookStore key 时仍可阅读。

## 4. 检查行为

打开用户页面，确认新增列，点击操作观察一次通知。离开再进入，列和操作不应重复。检查原有编辑与权限行为仍然生效。

## 5. 加入其他贡献者

分别阅读：

- [表格列](/zh/customization/table-columns)：用类型化 Vue 组件替换单元格。
- [实体操作](/zh/customization/entity-actions)：替换编辑并复用页面命令。
- [表单字段](/zh/customization/form-fields)：配置并持久化扩展属性。
- [工具栏操作](/zh/customization/toolbar-actions)：使用当前页记录上下文。

组合多个选项对象时，明确合并各映射与回调数组。对象展开会覆盖同名映射，不会自动拼接贡献者。

## 适用位置

内置／可复用模块使用贡献者配置，自己生成的业务页面直接修改列与 CRUD 方法。完整重写模块页面时，先理解[替换上下文](/zh/customization/replacement)，再复用默认操作。
