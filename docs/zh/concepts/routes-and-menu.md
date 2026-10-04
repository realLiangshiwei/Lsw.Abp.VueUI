# 路由与导航

业务页面可以在路由元数据中声明菜单，模块在启动时注册自己的导航项，再延迟加载页面。

```ts
const booksRoute = {
  path: '/books',
  component: () => import('./pages/BooksPage.vue'),
  meta: {
    title: 'BookStore::Menu:Books',
    requiredPolicy: 'BookStore.Books',
    routes: { name: 'BookStore::Menu:Books', order: 2, iconClass: 'bi bi-book' },
  },
};
```

将该记录加入传给 provideAbpRouter 的路由数组。requiredPolicy 同时控制守卫与菜单可见性，名称必须对应后端策略。

## 注册与修改

配置入口在启动时通过 RoutesService.add 注册菜单。flat、tree、visible 是 ComputedRef，分别提供平铺列表、完整树和当前用户可见树。

使用 patch(name, changes) 修改顺序或属性，remove(names) 移除项目，removeByParam(criteria) 按属性删除。稳定的 name 是导航身份，不要为了修改标签而随意改名。

## 延迟路由与解析器

```ts
import { lazyRoutes } from '@lsw-abpvue/core/router';

const identityRoute = lazyRoutes('/identity', () =>
  import('@lsw-abpvue/identity').then(module => module.createIdentityRoutes()),
);
```

首次进入前缀时添加模块路由。AbpRouterOutlet 根据 meta.providers 创建路由注入器，withResolvers 在页面显示前运行解析器，内置模块借此组装扩展。

## 布局

meta.layout 选择 application、account 或 empty，由主题提供实现，AbpDynamicLayout 选择渲染。模块使用配置入口注册菜单，避免为菜单提前加载全部页面。
