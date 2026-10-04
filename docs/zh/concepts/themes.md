# 主题

`theme-shared` 定义 UI 契约和反馈服务，不依赖 UI 库。`theme-basic` 使用 Bootstrap 样式和 Vue 控件实现契约。

## 注册与导入

```ts
import { provideAbpThemeBasic } from '@lsw-abpvue/theme-basic';
import { AbpButton, AbpModal } from '@lsw-abpvue/theme-shared';

const theme = provideAbpThemeBasic();
```

将 `theme` 放入启动提供者。模块页面从 theme-shared 导入控件，不直接依赖主题实现。Bootstrap、图标和 Basic Theme 样式的顺序见[应用启动](/zh/development/startup)。

## 契约

十二个控件覆盖按钮、输入、选择、开关、表单字段、日期、自动完成、模态框、分页、加载、Toast 宿主和确认宿主，属性、事件、插槽见[组件](/zh/components/)。

单控件替换使用 `provideThemeComponents`，外壳、Logo 和导航替换使用 `ReplaceableComponentsService` 与主题组件 key。布局不提供任意具名插槽，见[布局定制](/zh/customization/layout)。

## 模态框行为

`AbpModal` 保护用户关闭路径，原生输入事件或显式 `dirty` 可触发未保存确认，`busy` 阻止用户关闭。取消使用 footer 的 `close()`，保存成功直接设置显隐为 false。生命周期与无障碍行为见[模态框参考](/zh/components/modal)。

## 主题测试

自定义实现可使用 `@lsw-abpvue/theme-shared/testing` 的 `runThemeContractTests` 检查键盘交互、焦点、禁用和无障碍行为，测试通过后仍需要检查主题的视觉效果。

Basic Theme 支持明暗与跟随系统模式，RTL 随本地化方向切换。生成应用是客户端 SPA，平台安全 core 服务不等于完整服务端渲染主题模板。

[编写主题](/zh/customization/create-theme)。
