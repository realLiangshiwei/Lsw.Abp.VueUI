# 路由与菜单

模块启动时注册导航项，布局渲染形成的树，并根据当前用户可见权限过滤。业务路由可以通过元数据声明自己的菜单项。

## 页面声明菜单项

```ts
{
  path: '/books',
  component: () => import('./pages/BooksPage.vue'),
  meta: {
    title: 'BookStore::Menu:Books',
    requiredPolicy: 'BookStore.Books',
    routes: { name: 'BookStore::Menu:Books', order: 2, iconClass: 'bi bi-book' },
  },
}
```

meta.routes 是菜单项。requiredPolicy 同时用于路由守卫与菜单过滤：拒绝未授权访问，并隐藏入口。

## 模块注册菜单

模块页面首次进入时加载，菜单启动时就需要，所以模块 /config 入口只包含注册代码：

```ts
provideAppInitializer(() => {
  inject(RoutesService).add([
    {
      name: TenantManagementRouteNames.TenantManagement,
      parentName: ThemeSharedRouteNames.Administration,
      requiredPolicy: TenantManagementPolicyNames.TenantManagement,
      iconClass: 'bi bi-people',
      layout: LayoutType.application,
      order: 2,
    },
  ]);
});
```

不导入页面组件，即使应用从不打开租户管理，也能以很小的启动开销获得菜单。

## 修改模块注册项

```ts
const routes = inject(RoutesService);

routes.patch('AbpTenantManagement::Menu:TenantManagement', { order: 10 });
routes.remove(['AbpIdentity::Menu:Identity']);
routes.removeByParam({ parentName: 'AbpUiNavigation::Menu:Administration' });
```

flat、tree、visible 分别是完整扁平项、完整树、当前用户可见树。

## 模块路由懒加载

```ts
lazyRoutes('/identity', () =>
  import('@lsw-abpvue/identity').then(module => module.createIdentityRoutes(contributors)),
);
```

lazyRoutes 在首次进入前缀时向路由器添加模块记录，同时安装宿主传入的扩展贡献者。

## 解析器

```ts
{
  path: '/identity',
  component: AbpRouterOutlet,
  beforeEnter: [withResolvers([identityExtensionsResolver])],
  meta: { providers: provideIdentity(options), requiresAuthentication: true },
}
```

AbpRouterOutlet 根据 meta.providers 建立路由级注入器，withResolvers 在页面渲染前完成必要工作，包括模块扩展点组装。

## 布局

meta.layout 选择 application、account、empty。主题提供三种布局，AbpDynamicLayout 负责切换，路由无需自行嵌套布局组件。

## 浏览器标题

默认标题策略在导航成功后读取 meta.title，语言变化后重新计算。后缀与自定义格式见[标题策略](/zh/core/title-strategy)。菜单名、页面标题和文档标题是不同内容。
