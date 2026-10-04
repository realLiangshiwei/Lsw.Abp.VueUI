# 布局与导航

路由通过 `meta.layout` 选择 `application`、`account` 或 `empty`，Basic Theme 注册三种布局。应用布局包含侧栏、导航栏、面包屑、通知宿主与响应式导航。

## 品牌与外观

在环境配置中设置 `application.name` 和可选的 `application.logoUrl`。按 Bootstrap CSS、Bootstrap Icons CSS、`@lsw-abpvue/theme-basic/style.css` 的顺序导入样式，应用覆盖样式放在最后。

```css
:root {
  --abp-accent: #2563eb;
  --abp-accent-rgb: 37, 99, 235;
  --abp-accent-hover: #1d4ed8;
  --abp-accent-soft: #eff6ff;
}
```

Basic Theme 使用 `data-bs-theme` 表示明暗模式，必要时在 `[data-bs-theme='dark']` 中覆盖暗色值。来自 `@lsw-abpvue/theme-basic` 的 `useThemeMode()` 提供 `mode`、`resolved`、`set`、`toggle`，模式为 `light`、`dark`、`system`。

## 替换外壳局部

Basic Theme 使用组件 key，而不是具名布局插槽。在主题初始化器之后，通过 `ReplaceableComponentsService` 注册替换项。

| Key 常量 | 部位 |
| --- | --- |
| `ThemeBasicComponents.Logo` | Logo |
| `ThemeBasicComponents.Routes` | 侧栏导航 |
| `ThemeBasicComponents.NavItems` | 导航栏项目 |
| `ThemeBasicComponents.ApplicationLayout` | 完整应用外壳 |

导航栏和用户菜单的行为项通过 theme-shared 的 `NavItemsService`、`UserMenuService` 添加或修改。见[替换组件](/zh/customization/replacement)和[路由与导航](/zh/concepts/routes-and-menu)。
