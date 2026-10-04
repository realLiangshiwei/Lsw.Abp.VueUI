# 替换组件

贡献者无法表达所需 UI 时，可以替换整个页面。公共 key 保持稳定，例如 `Identity.UsersComponent`。

## 包装已有用户页面

创建 `src/components/UsersPageWithNotice.vue`：

<<< ../../examples/UsersPageWithNotice.vue

组件直接导入原始 `UsersPage`，增加提示，同时保留内置查询、CRUD、命令 token、贡献者与模态框行为。直接渲染导入的原组件，不会再次经过替换注册表而递归。

在本地化资源中添加 `BookStore::UsersNotice`，再注册包装组件：

~~~ts
import { inject, provideAppInitializer, ReplaceableComponentsService } from '@lsw-abpvue/core';
import { IdentityComponents } from '@lsw-abpvue/identity';
import UsersPageWithNotice from './components/UsersPageWithNotice.vue';

export const replaceUsers = provideAppInitializer(() => {
  inject(ReplaceableComponentsService).add({
    key: IdentityComponents.Users,
    component: UsersPageWithNotice,
  });
});
~~~

将 `replaceUsers` 加入已有启动提供者，排在模块注册之后。保留 Identity 路由，`AbpReplaceableRouteContainer` 选择注册组件；未注册时使用模块默认组件。

## 完整重写页面

替换页面仍位于模块路由注入器下，守卫、路由元数据与组装后的扩展注册表仍然可用。原页面的局部状态和命令不会自动创建。

使用 `AbpExtensibleTable` 或 `AbpPageToolbar` 时，默认操作可能解析 `USERS_PAGE`。通过 `provideAbp` 提供自己的 add、edit、remove、managePermissions 命令；同时负责刷新、验证、并发与对话框状态。也可以显式定义业务列与操作，不渲染模块扩展。

运行时更换注册组件可能重新挂载并丢失局部表单状态。通常在启动时注册；确需运行时切换时，应明确协调状态。

## 替换主题控件

~~~ts
import { provideThemeComponents } from '@lsw-abpvue/theme-shared';
import MyDatePicker from './components/MyDatePicker.vue';

const datePickerOverride = provideThemeComponents({ AbpDatePicker: MyDatePicker });
~~~

覆盖项放在选定主题提供者之后。十二个基础控件使用主题契约注册表，页面／布局组件使用 `ReplaceableComponentsService`。实现文档列出的模型、属性、事件和插槽，并运行主题契约测试。

## 检查效果

打开用户页面，确认提示和原有列；创建、编辑、取消记录，并检查没有路由权限的用户。确认宿主贡献者仍生效。完整重写页面还应检查默认操作引用的每一个命令。

另见[扩展回调](/zh/customization/extension-behavior)、[主题契约](/zh/concepts/themes)与[个人资料／设置页签](/zh/customization/profile-settings)。

## 保留模块扩展的完整替换

根据下面的示例创建 src/components/UsersReplacement.vue：

<<< ../../examples/UsersReplacement.vue

保留路由解析后的贡献器注册表，并提供默认 Users 操作所需的全部命令。页面管理列表，编辑前读取完整详情与角色，保存带上 roleNames 和 concurrencyStamp，以 U 和用户 id 打开包内权限管理。扩展 DTO 边界的类型转换表示运行时组装字段，不提供客户端请求体校验。

使用上面的替换初始化器，把导入改为 UsersReplacement。保留 Identity 配置与懒加载路由，并按生成模板安装、注册权限管理。示例不清空或重新注册默认项，宿主列、字段与操作贡献仍有效。

## 选择定制层次

| 需求 | 使用 |
| --- | --- |
| 增加提示或外围内容 | 直接导入原页面的包装 |
| 增加或调整列、字段、命令 | 贡献器 |
| 更改全部交互与布局并保留模块扩展契约 | 提供命令的完整替换 |
| 全局改变主题输入控件 | 主题组件覆盖 |

路由组件替换不改变后端端点与权限要求。只读替换也可以显式定义列，但应说明主动移除了哪些默认操作。

## 缺失命令排查

贡献操作出现 USERS_PAGE 的 NullInjectorError 时，检查替换是否在工具栏、表格子组件挂载前创建页面注入器。只有路由无法提供任意页面的局部函数。包装递归时，应直接导入原页面，不再使用同 key 的可替换容器。
