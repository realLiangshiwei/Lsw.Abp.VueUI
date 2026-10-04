# 编写主题

主题实现 theme-shared 契约并注册布局。UI 库依赖属于主题包，不应进入 theme-shared 或业务模块。

## 1. 实现控件

实现 `ABP_COMPONENT_KEYS` 的全部十二项，从 theme-shared 导入公共 props、emits、slots 类型。[组件参考](/zh/components/)定义契约并描述 Basic Theme 默认值。

保留受控值与事件、禁用和只读状态、标签关联与键盘行为。模态框使用 `useModal` 共享忙碌和未保存处理，通过 footer 暴露受保护的关闭方法。日期控件在用户未编辑时应保留 DTO 字符串表示。

## 2. 注册主题

提供者接受十二个控件与三个布局，仅使用 core 和 theme-shared 契约：

<<< ../../examples/custom-theme.ts

将返回值放入应用提供者数组，替代 `provideAbpThemeBasic()`。标准动态布局映射使用示例中的三个 key；需要不同映射时通过 core/router 的 `DYNAMIC_LAYOUTS` 提供。

## 3. 提供外壳

布局通过默认插槽接收页面内容。应用布局需要渲染导航与当前路由内容，并包含 `AbpToastHost`、`AbpConfirmHost`。账户布局为认证页面提供空间，空布局可以直接渲染插槽。共享导航行为使用 `RoutesService`、`NavItemsService`、`UserMenuService`。

实现中处理 RTL、小屏幕、浮层焦点、减少动态效果偏好与高对比度，样式与图标由主题提供。

## 4. 验证

通过测试宿主的 `ThemeUnderTest` 适配器，使用 `@lsw-abpvue/theme-shared/testing` 的 `runThemeContractTests`。检查焦点恢复、Escape、禁用操作、输入验证和可访问名称，然后在内置模块中检查两个方向与小屏幕。

范围较小的外观调整可使用[样式和外壳定制](/zh/customization/layout)或[单控件替换](/zh/customization/replacement)。
