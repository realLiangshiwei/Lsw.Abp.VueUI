# 浏览器标题策略

路由在成功导航后更新浏览器标签页标题。它与页面 heading、菜单标签是三个独立位置。

## 声明路由标题

~~~ts
const route = {
  path: '/books',
  component: () => import('../pages/BooksPage.vue'),
  meta: { title: 'BookStore::Menu:Books' },
};
~~~

当 `environment.application.name = 'BookStore'`，英文翻译为 `Books` 时，默认标题为 `Books | BookStore`。

| 条件 | 结果 |
| --- | --- |
| 路由有 `meta.title` | 本地化路由标题加应用名称 |
| 路由没有标题 | 应用名称 |
| 切换语言 | 重新计算当前标题 |
| 导航失败 | 保留原来的标题 |

Vue Router 会合并匹配路由的 metadata，策略读取当前 `to.meta.title`。子路由需要不同标题时，应显式声明自己的 title。

应用名称来自 `environment.application.name`，按普通文本使用。应用名称也需要本地化时，可以自定义策略。

## 移除应用名称后缀

~~~ts
provideAbpCore(withOptions({
  environment,
  disableProjectNameInTitle: true,
}));
~~~

有标题的路由会显示 `Books`，没有标题的路由仍显示应用名称。此选项属于 Core 配置，不是路由属性。

## 替换策略

创建 `src/custom-title.ts`：

<<< ../../examples/custom-title.ts

示例输出 `BookStore — Books`，并在初始化时显式订阅语言变化。通过路由与应用初始化器注册：

~~~ts
import { customTitleFeature, initializeCustomTitle } from './custom-title';

const providers = [
  provideAbpCore(withOptions({ environment })),
  provideAbpRouter(routes, customTitleFeature),
  initializeCustomTitle,
  // OAuth, theme and module providers...
];
~~~

`environment` 和 `routes` 使用应用已有的启动配置。`withTitleStrategy` 从 `@lsw-abpvue/core/router` 导入，传给 `provideAbpRouter`。替换服务实现 `setTitle(title: string | undefined): void`，可注入平台与本地化服务。

通过 `DocumentService` 访问文档，随服务销毁清理订阅。路由标题、`AbpPage.title` 和菜单标签可以共用 key，但它们分别控制不同的界面位置。

## 检查效果

依次访问有标题的路由、切换语言、访问无标题路由，并检查被守卫拒绝的导航，观察浏览器标签页。相关内容见[路由](/zh/concepts/routes-and-menu)。
