# 品牌与导航

Basic Theme 外壳渲染 Core 注册的菜单、theme-shared 导航栏项目，以及由 account／OAuth 提供者配置资料和退出行为的用户菜单。选择能满足需求的最小定制范围。

## 修改配置中的品牌

在 `public/dynamic-env.json` 设置 `application.name`、`application.logoUrl`，把图片放在 `public/brand.svg`。引用实际部署路径，包含必要的子路径。配置图片会保留默认首页链接和响应式外壳。应用 CSS 放在主题样式之后。

## 创建 Logo 与导航栏组件

创建 `src/components/BrandLogo.vue`：

<<< ../../examples/BrandLogo.vue

创建 `src/components/HelpNavItem.vue`：

<<< ../../examples/HelpNavItem.vue

导航组件渲染自己的列表项、RouterLink 和徽标，负责导航和可访问文字。组件替代普通项目的渲染，不是传给解析器的 HTML 字符串。

## 注册修改

创建 `src/custom-navigation.ts`，把组件导入改为 `./components/BrandLogo.vue`、`./components/HelpNavItem.vue`：

<<< ../../examples/custom-navigation.ts

在 `src/main.ts` 导入 `customNavigation`，放在路由、主题和模块配置提供者之后。保留原 Core／OAuth／account 配置。在已有路由数组增加 `/help`、`/activity`，菜单项不会创建路由。增加 BookStore 的 Support、Help、New 和 Activity 文本。

示例创建 Support 分组及 Help 子项，将 Identity 顺序改为 10，加入导航栏 Help 组件，并仅在认证时显示 My activity。用户菜单操作显式调用路由器。My account 补丁只改图标，保留账户提供者配置的目的地。

## 添加、修改、删除与排序

RoutesService 用稳定 `name` 标识项目，`parentName` 表示层级，`order` 表示同级顺序。修改标签资源不需要改名。初始化器放在目标模块之后。

```ts
const routes = inject(RoutesService);
routes.patch('BookStore::Help', { order: 2 });
routes.remove(['BookStore::Support']);
```

删除父项也删除子项。把它作为另一种定制方式使用，只有确实希望移除 Help 时才与前面的初始化器同时使用。已经注册的路由仍可访问，除非删除路由或守卫拒绝。

NavItemsService、UserMenuService 也支持 add、patch、remove。带 Vue `component` 的导航项自行实现渲染，普通命令项使用 `action`。不要假定设置 `path` 会让所有主题导航栏渲染 RouterLink；链接使用组件，命令使用路由动作。

`visible` 回调须同步读取响应式状态，`requiredPolicy` 增加权限过滤，不代替服务端授权。初始化器中先获取服务，再进入异步回调。

## 替换其他外壳部位

| Key | 部位 |
| --- | --- |
| `ThemeBasicComponents.Logo` | 首页链接与品牌 |
| `ThemeBasicComponents.Routes` | 侧栏导航 |
| `ThemeBasicComponents.NavItems` | 导航栏项目 |
| `ThemeBasicComponents.ApplicationLayout` | 完整应用外壳 |

通过 ReplaceableComponentsService 在默认主题注册后添加。这里使用公开组件 key，不是任意布局插槽。参见[替换](/zh/customization/replacement)。

完整外壳须保留路由内容、通知、确认、页面提示、面包屑和语言／用户控件。替换外壳不删除底层菜单与认证服务。

## 检查结果

从侧栏和导航栏打开 Help。退出后 My activity 消失，登录后重新出现；资料和退出保留配置的行为。检查 Identity 顺序、长应用名称、折叠侧栏、窄屏、暗色与 RTL。

修改不生效时检查初始化器是否早于默认注册、目标模块是否启用、name 是否正确。可见但不能操作的自定义项需要实际链接或动作，只有标签不够。外壳布局问题不要通过业务页面 CSS 修补。
